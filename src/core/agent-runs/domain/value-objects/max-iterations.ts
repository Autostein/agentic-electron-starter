import { AgentRunDomainError } from '../errors/agent-run-errors';

export const DEFAULT_AGENT_RUN_MAX_ITERATIONS = 1;
export const MAX_AGENT_RUN_ITERATIONS = 20;

export function normalizeMaxIterations(value: number | null | undefined): number {
  if (value === null || value === undefined) {
    return DEFAULT_AGENT_RUN_MAX_ITERATIONS;
  }

  if (!Number.isInteger(value) || value < 1 || value > MAX_AGENT_RUN_ITERATIONS) {
    throw new AgentRunDomainError(
      `Max iterations must be an integer between 1 and ${MAX_AGENT_RUN_ITERATIONS}.`,
      { details: { value } },
    );
  }

  return value;
}
