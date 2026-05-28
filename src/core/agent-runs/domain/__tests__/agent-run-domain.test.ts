import { describe, expect, it } from 'vitest';
import {
  assertCanTransitionAgentRunStatus,
  createAgentRunBranchName,
  createAgentRunCommitEvent,
  createAgentRunErrorEvent,
  createAgentRunStatusEvent,
  createQueuedAgentRun,
  isTerminalAgentRunStatus,
  transitionAgentRunStatus,
} from '..';
import type { AgentRun } from '..';

const baseRunInput = {
  id: 'run-1234567890',
  workspaceId: 'workspace-1',
  workspacePath: '/repo',
  workspaceName: 'repo',
  runtimeProfileId: 'profile-1',
  runtimeProfileName: 'Starter',
  runtimeImageName: 'agentic:test',
  provider: 'codex' as const,
  model: 'gpt-5.4',
  prompt: 'Implement feature',
  logFilePath: '/logs/run-1234567890.log',
  createdAt: 100,
};

describe('agent-run domain', () => {
  it('creates branch names from run ids and prompt slugs', () => {
    expect(createAgentRunBranchName({
      runId: 'abcdef1234567890',
      prompt: 'Implement Feature!!',
    })).toBe('agentic/abcdef12-implement-feature');
    expect(createAgentRunBranchName({
      runId: 'run-1234567890',
      prompt: '!!!',
    })).toBe('agentic/run-1234-run');
    expect(createAgentRunBranchName({
      runId: 'abcdef1234567890',
      prompt: 'A long prompt with enough words to exceed the limit',
    })).toBe('agentic/abcdef12-a-long-prompt-with-enough-words-to-e');
  });

  it('detects terminal statuses', () => {
    expect(isTerminalAgentRunStatus('queued')).toBe(false);
    expect(isTerminalAgentRunStatus('running')).toBe(false);
    expect(isTerminalAgentRunStatus('succeeded')).toBe(true);
    expect(isTerminalAgentRunStatus('failed')).toBe(true);
    expect(isTerminalAgentRunStatus('cancelled')).toBe(true);
  });

  it('allows valid status transitions', () => {
    expect(() => assertCanTransitionAgentRunStatus('queued', 'running')).not.toThrow();
    expect(() => assertCanTransitionAgentRunStatus('queued', 'failed')).not.toThrow();
    expect(() => assertCanTransitionAgentRunStatus('running', 'succeeded')).not.toThrow();
    expect(() => assertCanTransitionAgentRunStatus('running', 'cancelled')).not.toThrow();
  });

  it('rejects invalid status transitions', () => {
    expect(() => assertCanTransitionAgentRunStatus('running', 'queued')).toThrow(
      'Cannot transition agent run from running to queued.',
    );
    expect(() => assertCanTransitionAgentRunStatus('succeeded', 'failed')).toThrow(
      'Cannot transition agent run from succeeded to failed.',
    );
    expect(() => assertCanTransitionAgentRunStatus('cancelled', 'running')).toThrow(
      'Cannot transition agent run from cancelled to running.',
    );
  });

  it('creates queued runs with domain defaults', () => {
    const run = createQueuedAgentRun({
      ...baseRunInput,
      prompt: '  Implement feature  ',
    });

    expect(run).toMatchObject({
      id: 'run-1234567890',
      prompt: 'Implement feature',
      maxIterations: 1,
      status: 'queued',
      branchName: 'agentic/run-1234-implement-feature',
      startedAt: null,
      finishedAt: null,
      errorMessage: null,
    });
  });

  it('updates timestamps and errors during status transitions', () => {
    const queued = createQueuedAgentRun(baseRunInput);
    const running = transitionAgentRunStatus(queued, { status: 'running', now: 200 });
    const succeeded = transitionAgentRunStatus(running, { status: 'succeeded', now: 300 });

    expect(running).toMatchObject({
      status: 'running',
      startedAt: 200,
      finishedAt: null,
      errorMessage: null,
    });
    expect(succeeded).toMatchObject({
      status: 'succeeded',
      startedAt: 200,
      finishedAt: 300,
      errorMessage: null,
    });
  });

  it('preserves same-status transitions as no-ops', () => {
    const run: AgentRun = {
      ...createQueuedAgentRun(baseRunInput),
      status: 'running',
      startedAt: 200,
    };

    expect(transitionAgentRunStatus(run, { status: 'running', now: 300 })).toEqual(run);
  });

  it('creates canonical run events', () => {
    expect(createAgentRunStatusEvent({
      id: 'event-1',
      runId: 'run-1',
      status: 'running',
      createdAt: 100,
    })).toEqual({
      id: 'event-1',
      runId: 'run-1',
      type: 'status',
      message: 'Run started',
      createdAt: 100,
    });
    expect(createAgentRunCommitEvent({
      id: 'event-2',
      runId: 'run-1',
      sha: 'abc123',
      createdAt: 110,
    })).toMatchObject({ type: 'commit', message: 'abc123' });
    expect(createAgentRunErrorEvent({
      id: 'event-3',
      runId: 'run-1',
      message: null,
      createdAt: 120,
    })).toMatchObject({ type: 'error', message: 'Run failed' });
  });
});
