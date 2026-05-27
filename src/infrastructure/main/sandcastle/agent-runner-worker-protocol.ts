import type { AgentRuntimeSettings } from '../../../domain/agent-runtime';
import type { AgentRun, AgentRunEventType, AgentRunStatus } from '../../../domain/agent-runs';

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
