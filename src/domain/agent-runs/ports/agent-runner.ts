import type { AgentRunnerCallbacks, StartAgentRunnerInput } from '../entities/agent-run';

export interface AgentRunner {
  start(input: StartAgentRunnerInput, callbacks: AgentRunnerCallbacks): Promise<void>;
  cancel(runId: string): Promise<void>;
}
