import type { AgentRuntimeSettings } from '@/core/agent-runtime/domain';
import type { AgentRun, AgentRunEventType, AgentRunStatus } from '@/core/agent-runs/domain';

export type AgentRunnerWorkerStartMessage = {
  type: 'start';
  payload: {
    run: AgentRun;
    settings: AgentRuntimeSettings;
    worktreePath: string;
  };
};

export type AgentRunnerWorkerCancelMessage = {
  type: 'cancel';
};

export type AgentRunnerWorkerMessage =
  | AgentRunnerWorkerStartMessage
  | AgentRunnerWorkerCancelMessage;

export type AgentRunnerWorkerOutboundMessage =
  | {
    type: 'status';
    status: AgentRunStatus;
    message: string;
    createdAt: number;
  }
  | {
    type: 'event';
    eventType: AgentRunEventType;
    message: string;
    createdAt: number;
  }
  | {
    type: 'commit';
    sha: string;
  };
