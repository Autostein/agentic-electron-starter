import type {
  AgentRun,
  AgentRunCommit,
  AgentRunEvent,
  AgentRunStatus,
  CreateAgentRunInput,
} from '../entities/agent-run';

export interface AgentRunRepository {
  createRun(input: CreateAgentRunInput): Promise<AgentRun>;
  getRun(id: string): Promise<AgentRun | null>;
  listRuns(projectId?: string): Promise<AgentRun[]>;
  updateRunStatus(
    id: string,
    status: AgentRunStatus,
    timestamps: { startedAt?: number | null; finishedAt?: number | null; errorMessage?: string | null },
  ): Promise<void>;
  appendEvent(event: AgentRunEvent): Promise<void>;
  listEvents(runId: string): Promise<AgentRunEvent[]>;
  appendCommit(commit: AgentRunCommit): Promise<void>;
  listCommits(runId: string): Promise<AgentRunCommit[]>;
}
