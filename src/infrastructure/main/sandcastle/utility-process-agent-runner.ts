import path from 'node:path';
import { utilityProcess, type UtilityProcess } from 'electron';
import type {
  AgentRunner,
  AgentRunnerCallbacks,
  StartAgentRunnerInput,
} from '../../../domain/agent-runs';
import type {
  AgentRunnerWorkerMessage,
  AgentRunnerWorkerOutboundMessage,
} from './agent-runner-worker-protocol';

export type UtilityProcessAgentRunnerOptions = {
  workerPath: string;
  worktreesPath: string;
};

type ActiveRun = {
  child: UtilityProcess;
  callbacks: AgentRunnerCallbacks;
  terminal: boolean;
};

export class UtilityProcessAgentRunner implements AgentRunner {
  private readonly options: UtilityProcessAgentRunnerOptions;
  private readonly activeRuns = new Map<string, ActiveRun>();

  constructor(options: UtilityProcessAgentRunnerOptions) {
    this.options = options;
  }

  start(input: StartAgentRunnerInput, callbacks: AgentRunnerCallbacks): Promise<void> {
    const child = utilityProcess.fork(this.options.workerPath, [], {
      serviceName: `agent-run-${input.run.id}`,
      stdio: 'pipe',
    });
    const activeRun: ActiveRun = { child, callbacks, terminal: false };
    this.activeRuns.set(input.run.id, activeRun);

    child.on('message', (message: AgentRunnerWorkerOutboundMessage) => {
      this.handleMessage(input.run.id, activeRun, message);
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      this.dispatch(callbacks.onEvent, {
        runId: input.run.id,
        type: 'log',
        message: chunk.toString().trim(),
        createdAt: Date.now(),
      });
    });
    child.on('exit', (code) => {
      this.activeRuns.delete(input.run.id);
      if (!activeRun.terminal && code !== 0) {
        this.dispatch(callbacks.onStatus, 'failed', `Agent worker exited with code ${code}.`);
      }
    });

    return new Promise((resolve) => {
      child.once('spawn', () => {
        child.postMessage({
          type: 'start',
          payload: {
            ...input,
            worktreePath: path.join(this.options.worktreesPath, input.run.id),
          },
        } satisfies AgentRunnerWorkerMessage);
        resolve();
      });
    });
  }

  async cancel(runId: string): Promise<void> {
    const activeRun = this.activeRuns.get(runId);

    if (!activeRun) {
      return;
    }

    activeRun.child.postMessage({ type: 'cancel' } satisfies AgentRunnerWorkerMessage);
    setTimeout(() => {
      if (this.activeRuns.has(runId)) {
        activeRun.child.kill();
      }
    }, 2500);
  }

  private handleMessage(
    runId: string,
    activeRun: ActiveRun,
    message: AgentRunnerWorkerOutboundMessage,
  ): void {
    if (message.type === 'status') {
      activeRun.terminal = ['succeeded', 'failed', 'cancelled'].includes(message.status);
      this.dispatch(
        activeRun.callbacks.onStatus,
        message.status,
        message.status === 'failed' ? message.message : null,
      );
      return;
    }

    if (message.type === 'commit') {
      this.dispatch(activeRun.callbacks.onCommit, message.sha);
      return;
    }

    this.dispatch(activeRun.callbacks.onEvent, {
      runId,
      type: message.eventType,
      message: message.message,
      createdAt: message.createdAt,
    });
  }

  private dispatch<T extends unknown[]>(
    callback: (...args: T) => void | Promise<void>,
    ...args: T
  ): void {
    void Promise.resolve(callback(...args)).catch((error: unknown) => {
      console.error(error);
    });
  }
}
