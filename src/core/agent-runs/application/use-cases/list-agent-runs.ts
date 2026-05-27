import type { AgentRun, AgentRunRepository } from '../../domain';

export type ListAgentRunsDeps = {
  agentRunRepository: AgentRunRepository;
};

export function listAgentRuns(
  input: { projectId?: string },
  deps: ListAgentRunsDeps,
): Promise<AgentRun[]> {
  return deps.agentRunRepository.listRuns(input.projectId);
}
