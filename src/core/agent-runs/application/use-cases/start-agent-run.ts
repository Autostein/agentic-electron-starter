import type {
  AgentProviderId,
  DockerImageBuilder,
  AgentRuntimeSettingsRepository,
} from '@/core/agent-runtime/domain';
import type {
  AgentRun,
  AgentRunEvent,
  AgentRunRepository,
  AgentRunStatus,
  AgentRunner,
} from '../../domain';
import type { ProjectRepository } from '@/core/projects/domain';

export type StartAgentRunInput = {
  projectId: string;
  provider: AgentProviderId;
  model: string;
  prompt: string;
  maxIterations?: number;
};

export type StartAgentRunDeps = {
  agentRunRepository: AgentRunRepository;
  agentRunner: AgentRunner;
  projectRepository: ProjectRepository;
  settingsRepository: AgentRuntimeSettingsRepository;
  dockerImageBuilder: DockerImageBuilder;
  createId: () => string;
  createLogFilePath: (runId: string) => string;
  now: () => number;
  publishEvent: (event: AgentRunEvent) => void;
};

export async function startAgentRun(
  input: StartAgentRunInput,
  deps: StartAgentRunDeps,
): Promise<AgentRun> {
  const project = await deps.projectRepository.getProject(input.projectId);

  if (!project) {
    throw new Error('Project not found.');
  }

  const settings = await deps.settingsRepository.getSettings();
  const imageStatus = await deps.dockerImageBuilder.getImageStatus(
    { imageName: settings.dockerImageName },
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
    projectId: project.id,
    projectPath: project.path,
    projectName: project.name,
    provider: input.provider,
    model: input.model,
    prompt: input.prompt,
    maxIterations: input.maxIterations ?? 1,
    branchName,
    logFilePath: deps.createLogFilePath(runId),
    createdAt: now,
  });

  await deps.agentRunner.start(
    { run, settings },
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
