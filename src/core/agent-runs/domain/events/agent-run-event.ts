import type { AgentRunStatus } from '../entities/agent-run';
import { toAgentRunStatusMessage } from '../policies/agent-run-status-policy';

export type AgentRunEventType = 'status' | 'log' | 'tool' | 'commit' | 'error';

export type AgentRunEvent = {
  id: string;
  runId: string;
  type: AgentRunEventType;
  message: string;
  createdAt: number;
};

export type CreateAgentRunEventInput = {
  id: string;
  runId: string;
  type: AgentRunEventType;
  message: string;
  createdAt: number;
};

export type CreateAgentRunStatusEventInput = {
  id: string;
  runId: string;
  status: AgentRunStatus;
  message?: string | null;
  createdAt: number;
};

export type CreateAgentRunLogEventInput = {
  id: string;
  runId: string;
  message: string;
  createdAt: number;
};

export type CreateAgentRunCommitEventInput = {
  id: string;
  runId: string;
  sha: string;
  createdAt: number;
};

export type CreateAgentRunErrorEventInput = {
  id: string;
  runId: string;
  message?: string | null;
  createdAt: number;
};

export function createAgentRunEvent(input: CreateAgentRunEventInput): AgentRunEvent {
  return {
    id: input.id,
    runId: input.runId,
    type: input.type,
    message: input.message,
    createdAt: input.createdAt,
  };
}

export function createAgentRunStatusEvent(
  input: CreateAgentRunStatusEventInput,
): AgentRunEvent {
  return createAgentRunEvent({
    id: input.id,
    runId: input.runId,
    type: 'status',
    message: input.message ?? toAgentRunStatusMessage(input.status),
    createdAt: input.createdAt,
  });
}

export function createAgentRunLogEvent(input: CreateAgentRunLogEventInput): AgentRunEvent {
  return createAgentRunEvent({
    id: input.id,
    runId: input.runId,
    type: 'log',
    message: input.message,
    createdAt: input.createdAt,
  });
}

export function createAgentRunCommitEvent(input: CreateAgentRunCommitEventInput): AgentRunEvent {
  return createAgentRunEvent({
    id: input.id,
    runId: input.runId,
    type: 'commit',
    message: input.sha,
    createdAt: input.createdAt,
  });
}

export function createAgentRunErrorEvent(input: CreateAgentRunErrorEventInput): AgentRunEvent {
  return createAgentRunEvent({
    id: input.id,
    runId: input.runId,
    type: 'error',
    message: input.message ?? toAgentRunStatusMessage('failed'),
    createdAt: input.createdAt,
  });
}
