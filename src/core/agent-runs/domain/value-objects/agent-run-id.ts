import { AgentRunDomainError } from '../errors/agent-run-errors';

export type AgentRunId = string & { readonly __agentRunIdBrand: 'AgentRunId' };

export function normalizeAgentRunId(value: string): AgentRunId {
  const id = value.trim();

  if (!id) {
    throw new AgentRunDomainError('Agent run id is required.');
  }

  return id as AgentRunId;
}
