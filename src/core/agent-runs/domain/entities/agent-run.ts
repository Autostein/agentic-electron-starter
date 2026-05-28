import type { AgentProviderId, AgentRuntimeProfile } from '@/core/agent-runtime/domain';
import type { AgentRunEvent } from '../events/agent-run-event';
import { createAgentRunBranchName } from '../policies/agent-run-branch-name';
import {
  assertCanTransitionAgentRunStatus,
  isTerminalAgentRunStatus,
} from '../policies/agent-run-status-policy';
import { normalizeAgentPrompt } from '../value-objects/agent-prompt';
import { normalizeAgentRunId } from '../value-objects/agent-run-id';
import { normalizeMaxIterations } from '../value-objects/max-iterations';

export type AgentRunStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

export type AgentRun = {
  id: string;
  workspaceId: string;
  workspacePath: string;
  workspaceName: string;
  runtimeProfileId: string;
  runtimeProfileName: string;
  runtimeImageName: string;
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
  workspaceId: string;
  workspacePath: string;
  workspaceName: string;
  runtimeProfileId: string;
  runtimeProfileName: string;
  runtimeImageName: string;
  provider: AgentProviderId;
  model: string;
  prompt: string;
  maxIterations: number;
  branchName: string;
  logFilePath: string;
  createdAt: number;
};

export type CreateQueuedAgentRunInput = Omit<
  CreateAgentRunInput,
  'id' | 'prompt' | 'maxIterations' | 'branchName'
> & {
  id: string;
  prompt: string;
  maxIterations?: number | null;
};

export type AgentRunCommit = {
  runId: string;
  sha: string;
  createdAt: number;
};

export type StartAgentRunnerInput = {
  run: AgentRun;
  profile: AgentRuntimeProfile;
};

export type AgentRunnerCallbacks = {
  onEvent: (event: Omit<AgentRunEvent, 'id'>) => void | Promise<void>;
  onStatus: (status: AgentRunStatus, errorMessage?: string | null) => void | Promise<void>;
  onCommit: (sha: string) => void | Promise<void>;
};

export type TransitionAgentRunStatusInput = {
  status: AgentRunStatus;
  now: number;
  errorMessage?: string | null;
};

export function createQueuedAgentRun(input: CreateQueuedAgentRunInput): AgentRun {
  const id = normalizeAgentRunId(input.id);
  const prompt = normalizeAgentPrompt(input.prompt);
  const maxIterations = normalizeMaxIterations(input.maxIterations);

  return {
    ...input,
    id,
    prompt,
    maxIterations,
    branchName: createAgentRunBranchName({ runId: id, prompt }),
    status: 'queued',
    startedAt: null,
    finishedAt: null,
    errorMessage: null,
  };
}

export function transitionAgentRunStatus(
  run: AgentRun,
  input: TransitionAgentRunStatusInput,
): AgentRun {
  assertCanTransitionAgentRunStatus(run.status, input.status);

  if (run.status === input.status) {
    return { ...run };
  }

  if (input.status === 'running') {
    return {
      ...run,
      status: input.status,
      startedAt: run.startedAt ?? input.now,
      finishedAt: null,
      errorMessage: null,
    };
  }

  if (isTerminalAgentRunStatus(input.status)) {
    return {
      ...run,
      status: input.status,
      finishedAt: input.now,
      errorMessage: input.status === 'failed' ? input.errorMessage ?? null : null,
    };
  }

  return {
    ...run,
    status: input.status,
    errorMessage: null,
  };
}

export type { AgentRunEvent, AgentRunEventType } from '../events/agent-run-event';
