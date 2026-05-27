import type { AgentRunEvent, AgentRunRepository, AgentRunner } from '../../domain';

export type CancelAgentRunDeps = {
  agentRunRepository: AgentRunRepository;
  agentRunner: AgentRunner;
  createId: () => string;
  now: () => number;
  publishEvent: (event: AgentRunEvent) => void;
};

export async function cancelAgentRun(
  runId: string,
  deps: CancelAgentRunDeps,
): Promise<void> {
  const run = await deps.agentRunRepository.getRun(runId);

  if (!run || ['succeeded', 'failed', 'cancelled'].includes(run.status)) {
    return;
  }

  const now = deps.now();
  await deps.agentRunner.cancel(runId);
  await deps.agentRunRepository.updateRunStatus(runId, 'cancelled', {
    finishedAt: now,
    errorMessage: null,
  });

  const event: AgentRunEvent = {
    id: deps.createId(),
    runId,
    type: 'status',
    message: 'Run cancelled',
    createdAt: now,
  };
  await deps.agentRunRepository.appendEvent(event);
  deps.publishEvent(event);
}
