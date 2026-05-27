import { randomUUID } from 'node:crypto';
import { ipcMain } from 'electron';
import type {
  AgentRunCommitDetail,
  AgentRunCommitFileDiff,
} from '@/core/agent-runs/application/read-models/commit-diff';
import { cancelAgentRun } from '@/core/agent-runs/application/use-cases/cancel-agent-run';
import { getAgentRun } from '@/core/agent-runs/application/use-cases/get-agent-run';
import { getAgentRunCommitDetails } from '@/core/agent-runs/application/use-cases/get-agent-run-commit-details';
import { getAgentRunCommitFileDiff } from '@/core/agent-runs/application/use-cases/get-agent-run-commit-file-diff';
import { listAgentRuns } from '@/core/agent-runs/application/use-cases/list-agent-runs';
import type { GitCommitReadService } from '@/core/agent-runs/application/ports/git-commit-read-service';
import { startAgentRun } from '@/core/agent-runs/application/use-cases/start-agent-run';
import type {
  AgentRunEvent,
  AgentRunRepository,
  AgentRunner,
} from '@/core/agent-runs/domain';
import type {
  AgentRuntimeSettingsRepository,
  DockerImageBuilder,
} from '@/core/agent-runtime/domain';
import type { ProjectRepository } from '@/core/projects/domain';
import {
  AGENT_RUNS_IPC_CHANNELS,
  AgentRunCommitDetailSchema,
  AgentRunCommitFileDiffSchema,
  AgentRunDetailSchema,
  AgentRunListResultSchema,
  AgentRunResultSchema,
  CancelAgentRunInputSchema,
  GetAgentRunCommitDetailsInputSchema,
  GetAgentRunCommitFileDiffInputSchema,
  GetAgentRunInputSchema,
  ListAgentRunsInputSchema,
  StartAgentRunInputSchema,
  type AgentRunDetailResult,
  type AgentRunResult,
} from '@/contracts/ipc/agent-runs.contract';

export type AgentRunsIpcDeps = {
  agentRunRepository: AgentRunRepository;
  agentRunner: AgentRunner;
  gitCommitReadService: GitCommitReadService;
  projectRepository: ProjectRepository;
  settingsRepository: AgentRuntimeSettingsRepository;
  dockerImageBuilder: DockerImageBuilder;
  createLogFilePath: (runId: string) => string;
  publishEvent: (event: AgentRunEvent) => void;
  now: () => number;
};

export function createAgentRunsIpcHandlers(deps: AgentRunsIpcDeps) {
  return {
    start: async (_event: unknown, payload: unknown): Promise<AgentRunResult> => {
      const input = StartAgentRunInputSchema.parse(payload);
      const run = await startAgentRun(input, {
        agentRunRepository: deps.agentRunRepository,
        agentRunner: deps.agentRunner,
        projectRepository: deps.projectRepository,
        settingsRepository: deps.settingsRepository,
        dockerImageBuilder: deps.dockerImageBuilder,
        createId: randomUUID,
        createLogFilePath: deps.createLogFilePath,
        publishEvent: deps.publishEvent,
        now: deps.now,
      });

      return AgentRunResultSchema.parse(run);
    },
    list: async (_event: unknown, payload: unknown): Promise<AgentRunResult[]> => {
      const input = ListAgentRunsInputSchema.parse(payload);
      const runs = await listAgentRuns(input ?? {}, {
        agentRunRepository: deps.agentRunRepository,
      });

      return AgentRunListResultSchema.parse(runs);
    },
    get: async (_event: unknown, payload: unknown): Promise<AgentRunDetailResult> => {
      const input = GetAgentRunInputSchema.parse(payload);
      const detail = await getAgentRun(input.id, {
        agentRunRepository: deps.agentRunRepository,
        gitCommitReadService: deps.gitCommitReadService,
      });

      if (!detail) {
        throw new Error('Agent run not found.');
      }

      return AgentRunDetailSchema.parse(detail);
    },
    getCommitDetails: async (_event: unknown, payload: unknown): Promise<AgentRunCommitDetail> => {
      const input = GetAgentRunCommitDetailsInputSchema.parse(payload);
      const detail = await getAgentRunCommitDetails(input, {
        agentRunRepository: deps.agentRunRepository,
        gitCommitReadService: deps.gitCommitReadService,
      });

      return AgentRunCommitDetailSchema.parse(detail);
    },
    getCommitFileDiff: async (_event: unknown, payload: unknown): Promise<AgentRunCommitFileDiff> => {
      const input = GetAgentRunCommitFileDiffInputSchema.parse(payload);
      const diff = await getAgentRunCommitFileDiff(input, {
        agentRunRepository: deps.agentRunRepository,
        gitCommitReadService: deps.gitCommitReadService,
      });

      return AgentRunCommitFileDiffSchema.parse(diff);
    },
    cancel: async (_event: unknown, payload: unknown): Promise<void> => {
      const input = CancelAgentRunInputSchema.parse(payload);
      await cancelAgentRun(input.id, {
        agentRunRepository: deps.agentRunRepository,
        agentRunner: deps.agentRunner,
        createId: randomUUID,
        publishEvent: deps.publishEvent,
        now: deps.now,
      });
    },
  };
}

export function registerAgentRunsIpcHandlers(deps: AgentRunsIpcDeps): void {
  const handlers = createAgentRunsIpcHandlers(deps);
  ipcMain.handle(AGENT_RUNS_IPC_CHANNELS.start, handlers.start);
  ipcMain.handle(AGENT_RUNS_IPC_CHANNELS.list, handlers.list);
  ipcMain.handle(AGENT_RUNS_IPC_CHANNELS.get, handlers.get);
  ipcMain.handle(AGENT_RUNS_IPC_CHANNELS.getCommitDetails, handlers.getCommitDetails);
  ipcMain.handle(AGENT_RUNS_IPC_CHANNELS.getCommitFileDiff, handlers.getCommitFileDiff);
  ipcMain.handle(AGENT_RUNS_IPC_CHANNELS.cancel, handlers.cancel);
}
