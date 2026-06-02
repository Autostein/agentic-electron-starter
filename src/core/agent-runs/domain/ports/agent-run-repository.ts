import type {
  AgentRun,
  AgentRunCommit,
  AgentRunEvent,
  AgentRunStatusTransition,
  CreateAgentRunInput,
} from '../entities/agent-run';

export interface AgentRunRepository {
  createRun(input: CreateAgentRunInput): Promise<AgentRun>;
  getRun(id: string): Promise<AgentRun | null>;
  listRuns(workspaceId?: string): Promise<AgentRun[]>;
  hasActiveRunForTargetFolder(targetFolderId: string): Promise<boolean>;
  applyRunStatusTransition(transition: AgentRunStatusTransition): Promise<void>;
  appendEvent(event: AgentRunEvent): Promise<void>;
  listEvents(runId: string): Promise<AgentRunEvent[]>;
  appendCommit(commit: AgentRunCommit): Promise<void>;
  listCommits(runId: string): Promise<AgentRunCommit[]>;
}
