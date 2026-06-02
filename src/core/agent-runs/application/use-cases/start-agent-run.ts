import type {
  AgentProviderId,
  DockerImageBuilder,
  AgentRuntimeProfile,
  AgentRuntimeProfileRepository,
} from '@/core/agent-runtime/domain';
import { AppError } from '@/shared/app-errors';
import type {
  AgentRun,
  AgentRunEvent,
  AgentRunRepository,
  AgentRunner,
} from '../../domain';
import {
  createAgentRunCommitEvent,
  createAgentRunErrorEvent,
  createAgentRunEvent,
  createAgentRunStatusEvent,
  createQueuedAgentRun,
  transitionAgentRunStatus,
} from '../../domain';
import type { WorkspaceRepository } from '@/core/workspaces/domain';

export type StartAgentRunInput = {
  workspaceId: string;
  targetFolderId: string;
  runtimeProfileId: string;
  provider: AgentProviderId;
  model: string;
  prompt: string;
  maxIterations?: number;
};

export type StartAgentRunDeps = {
  agentRunRepository: AgentRunRepository;
  agentRunner: AgentRunner;
  workspaceRepository: WorkspaceRepository;
  profileRepository: AgentRuntimeProfileRepository;
  dockerImageBuilder: DockerImageBuilder;
  validateRuntimeProfile: (
    profile: AgentRuntimeProfile,
    provider: AgentProviderId,
  ) => void | Promise<void>;
  createId: () => string;
  createLogFilePath: (runId: string) => string;
  now: () => number;
  publishEvent: (event: AgentRunEvent) => void;
};

export async function startAgentRun(
  input: StartAgentRunInput,
  deps: StartAgentRunDeps,
): Promise<AgentRun> {
  const workspace = await deps.workspaceRepository.getWorkspaceDetail(input.workspaceId);

  if (!workspace) {
    throw new AppError('NOT_FOUND', 'Workspace not found.');
  }

  const targetFolder = workspace.folders.find((folder) => folder.id === input.targetFolderId);

  if (!targetFolder) {
    throw new AppError('NOT_FOUND', 'Workspace folder not found.');
  }

  const profile = await deps.profileRepository.getProfile(input.runtimeProfileId);

  if (!profile) {
    throw new AppError('NOT_FOUND', 'Runtime profile not found.');
  }

  await deps.validateRuntimeProfile(profile, input.provider);

  const imageStatus = await deps.dockerImageBuilder.getImageStatus(
    {
      imageName: profile.imageName,
      sourceKind: profile.sourceKind,
      profilePath: profile.profilePath,
    },
    deps.now(),
  );

  if (!imageStatus.available) {
    throw new AppError(
      imageStatus.errorCode ?? 'IMAGE_MISSING',
      imageStatus.errorCode === 'DOCKER_UNAVAILABLE'
        ? imageStatus.errorMessage ?? 'Docker is unavailable.'
        : 'Sandbox image is not available. Build it first.',
    );
  }

  const runId = deps.createId();
  const now = deps.now();
  const queuedRun = createQueuedAgentRun({
    id: runId,
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    targetFolderId: targetFolder.id,
    targetFolderPath: targetFolder.path,
    targetFolderLabel: targetFolder.label,
    runtimeProfileId: profile.id,
    runtimeProfileName: profile.name,
    runtimeImageName: profile.imageName,
    provider: input.provider,
    model: input.model,
    prompt: input.prompt,
    maxIterations: input.maxIterations,
    logFilePath: deps.createLogFilePath(runId),
    createdAt: now,
  });
  let currentRun = await deps.agentRunRepository.createRun(queuedRun);
  const run = currentRun;

  await deps.agentRunner.start(
    {
      run,
      profile,
      contextFolders: workspace.folders
        .filter((folder) => folder.id !== targetFolder.id)
        .map((folder) => ({
          id: folder.id,
          label: folder.label,
          path: folder.path,
          sandboxPath: toContextFolderSandboxPath(folder.id),
        })),
    },
    {
      onEvent: async (event) => {
        await recordEvent(
          createAgentRunEvent({
            ...event,
            id: deps.createId(),
          }),
          deps,
        );
      },
      onStatus: async (status, errorMessage) => {
        const statusAt = deps.now();
        const persistedRun = await deps.agentRunRepository.getRun(runId);

        if (!persistedRun) {
          return;
        }

        const transition = transitionAgentRunStatus(persistedRun, {
          status,
          now: statusAt,
          errorMessage,
        });
        currentRun = transition.nextRun;

        await deps.agentRunRepository.applyRunStatusTransition(transition);
        await recordEvent(
          status === 'failed' ? createAgentRunErrorEvent({
            id: deps.createId(),
            runId,
            createdAt: statusAt,
            message: errorMessage,
          }) : createAgentRunStatusEvent({
            id: deps.createId(),
            runId,
            status,
            createdAt: statusAt,
          }),
          deps,
        );
      },
      onCommit: async (sha) => {
        const commitAt = deps.now();
        await deps.agentRunRepository.appendCommit({
          runId,
          sha,
          createdAt: commitAt,
        });
        await recordEvent(
          createAgentRunCommitEvent({
            id: deps.createId(),
            runId,
            sha,
            createdAt: commitAt,
          }),
          deps,
        );
      },
    },
  );

  return run;
}

function toContextFolderSandboxPath(folderId: string): string {
  const safeId = folderId.replace(/[^a-zA-Z0-9_.-]/g, '-') || 'folder';
  return `/mnt/agentic/context/${safeId}`;
}

async function recordEvent(
  event: AgentRunEvent,
  deps: Pick<StartAgentRunDeps, 'agentRunRepository' | 'publishEvent'>,
): Promise<void> {
  await deps.agentRunRepository.appendEvent(event);
  deps.publishEvent(event);
}
