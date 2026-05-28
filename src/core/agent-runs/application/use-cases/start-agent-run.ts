import type {
  AgentProviderId,
  DockerImageBuilder,
  AgentRuntimeProfile,
  AgentRuntimeProfileRepository,
} from '@/core/agent-runtime/domain';
import type {
  AgentRun,
  AgentRunEvent,
  AgentRunRepository,
  AgentRunStatus,
  AgentRunner,
} from '../../domain';
import type { WorkspaceRepository } from '@/core/workspaces/domain';

export type StartAgentRunInput = {
  workspaceId: string;
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
  const workspace = await deps.workspaceRepository.getWorkspace(input.workspaceId);

  if (!workspace) {
    throw new Error('Workspace not found.');
  }

  const profile = await deps.profileRepository.getProfile(input.runtimeProfileId);

  if (!profile) {
    throw new Error('Runtime profile not found.');
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
    throw new Error('Sandbox image is not available. Build it first.');
  }

  const runId = deps.createId();
  const now = deps.now();
  const branchName = toRunBranchName(runId, input.prompt);
  const run = await deps.agentRunRepository.createRun({
    id: runId,
    workspaceId: workspace.id,
    workspacePath: workspace.path,
    workspaceName: workspace.name,
    runtimeProfileId: profile.id,
    runtimeProfileName: profile.name,
    runtimeImageName: profile.imageName,
    provider: input.provider,
    model: input.model,
    prompt: input.prompt,
    maxIterations: input.maxIterations ?? 1,
    branchName,
    logFilePath: deps.createLogFilePath(runId),
    createdAt: now,
  });

  await deps.agentRunner.start(
    { run, profile },
    {
      onEvent: async (event) => {
        await recordEvent(
          {
            ...event,
            id: deps.createId(),
          },
          deps,
        );
      },
      onStatus: async (status, errorMessage) => {
        const statusAt = deps.now();
        await deps.agentRunRepository.updateRunStatus(runId, status, {
          startedAt: status === 'running' ? statusAt : undefined,
          finishedAt: isTerminalStatus(status) ? statusAt : undefined,
          errorMessage: errorMessage ?? null,
        });
        await recordEvent(
          {
            id: deps.createId(),
            runId,
            type: status === 'failed' ? 'error' : 'status',
            message: errorMessage ?? toStatusMessage(status),
            createdAt: statusAt,
          },
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
          {
            id: deps.createId(),
            runId,
            type: 'commit',
            message: sha,
            createdAt: commitAt,
          },
          deps,
        );
      },
    },
  );

  return run;
}

async function recordEvent(
  event: AgentRunEvent,
  deps: Pick<StartAgentRunDeps, 'agentRunRepository' | 'publishEvent'>,
): Promise<void> {
  await deps.agentRunRepository.appendEvent(event);
  deps.publishEvent(event);
}

function isTerminalStatus(status: AgentRunStatus): boolean {
  return ['succeeded', 'failed', 'cancelled'].includes(status);
}

function toStatusMessage(status: AgentRunStatus): string {
  switch (status) {
    case 'queued':
      return 'Run queued';
    case 'running':
      return 'Run started';
    case 'succeeded':
      return 'Run completed';
    case 'failed':
      return 'Run failed';
    case 'cancelled':
      return 'Run cancelled';
  }
}

function toRunBranchName(runId: string, prompt: string): string {
  const slug = prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 36) || 'run';

  return `agentic/${runId.slice(0, 8)}-${slug}`;
}
