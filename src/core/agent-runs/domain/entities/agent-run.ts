import type { AgentProviderId, AgentRuntimeSettings } from '@/core/agent-runtime/domain';

export type AgentRunStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

export type AgentRun = {
  id: string;
  projectId: string;
  projectPath: string;
  projectName: string;
  provider: AgentProviderId;
  model: string;
  prompt: string;
  maxIterations: number;
  status: AgentRunStatus;
  branchName: string;
  logFilePath: string;
  createdAt: number;
  startedAt: number | null;
  finishedAt: number | null;
  errorMessage: string | null;
};

export type CreateAgentRunInput = {
  id: string;
  projectId: string;
  projectPath: string;
  projectName: string;
  provider: AgentProviderId;
  model: string;
  prompt: string;
  maxIterations: number;
  branchName: string;
  logFilePath: string;
  createdAt: number;
};

export type AgentRunEventType = 'status' | 'log' | 'tool' | 'commit' | 'error';

export type AgentRunEvent = {
  id: string;
  runId: string;
  type: AgentRunEventType;
  message: string;
  createdAt: number;
};

export type AgentRunCommit = {
  runId: string;
  sha: string;
  createdAt: number;
};

export type StartAgentRunnerInput = {
  run: AgentRun;
  settings: AgentRuntimeSettings;
};

export type AgentRunnerCallbacks = {
  onEvent: (event: Omit<AgentRunEvent, 'id'>) => void | Promise<void>;
  onStatus: (status: AgentRunStatus, errorMessage?: string | null) => void | Promise<void>;
  onCommit: (sha: string) => void | Promise<void>;
};
