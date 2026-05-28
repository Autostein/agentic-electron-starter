import type { AgentRunStatus } from '../entities/agent-run';
import { AgentRunDomainError } from '../errors/agent-run-errors';

const terminalStatuses = new Set<AgentRunStatus>(['succeeded', 'failed', 'cancelled']);

const allowedTransitions: Record<AgentRunStatus, readonly AgentRunStatus[]> = {
  queued: ['queued', 'running', 'failed', 'cancelled'],
  running: ['running', 'succeeded', 'failed', 'cancelled'],
  succeeded: ['succeeded'],
  failed: ['failed'],
  cancelled: ['cancelled'],
};

export function isTerminalAgentRunStatus(status: AgentRunStatus): boolean {
  return terminalStatuses.has(status);
}

export function assertCanTransitionAgentRunStatus(
  current: AgentRunStatus,
  next: AgentRunStatus,
): void {
  if (allowedTransitions[current].includes(next)) {
    return;
  }

  throw new AgentRunDomainError(`Cannot transition agent run from ${current} to ${next}.`, {
    details: { current, next },
  });
}

export function toAgentRunStatusMessage(status: AgentRunStatus): string {
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
