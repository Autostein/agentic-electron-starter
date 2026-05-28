import type { AgentRun, AgentRunRepository } from '../../domain';

export type ListAgentRunsDeps = {
  agentRunRepository: AgentRunRepository;
};

export function listAgentRuns(
  input: { workspaceId?: string },
  deps: ListAgentRunsDeps,
): Promise<AgentRun[]> {
  return deps.agentRunRepository.listRuns(input.workspaceId);
}
