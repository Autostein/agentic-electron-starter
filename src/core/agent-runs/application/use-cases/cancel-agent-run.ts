import type { AgentRunEvent, AgentRunRepository, AgentRunner } from '../../domain';
import {
  createAgentRunStatusEvent,
  isTerminalAgentRunStatus,
  transitionAgentRunStatus,
} from '../../domain';

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

  if (!run || isTerminalAgentRunStatus(run.status)) {
    return;
  }

  const now = deps.now();
  await deps.agentRunner.cancel(runId);
  const transition = transitionAgentRunStatus(run, {
    status: 'cancelled',
    now,
  });
  const cancelledRun = transition.nextRun;
  await deps.agentRunRepository.applyRunStatusTransition(transition);

  const event: AgentRunEvent = createAgentRunStatusEvent({
    id: deps.createId(),
    runId,
    status: cancelledRun.status,
    createdAt: now,
  });
  await deps.agentRunRepository.appendEvent(event);
  deps.publishEvent(event);
}
