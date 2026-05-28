import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {
  claudeCode,
  codex,
  run,
  type AgentStreamEvent,
  type MountConfig,
} from '@ai-hero/sandcastle';
import { docker } from '@ai-hero/sandcastle/sandboxes/docker';
import { assertCliAuthPath } from '@/infrastructure/main/agent-runtime/cli-auth-paths';
import type {
  AgentRunnerWorkerMessage,
  AgentRunnerWorkerOutboundMessage,
  AgentRunnerWorkerStartMessage,
} from '@/infrastructure/main/sandcastle/agent-runner-worker-protocol';

let abortController: AbortController | null = null;

const parentPort = process.parentPort;

if (!parentPort) {
  throw new Error('Agent runner worker must be launched as an Electron utility process.');
}

parentPort.on('message', (event) => {
  const message = event.data as AgentRunnerWorkerMessage;

  if (message.type === 'cancel') {
    abortController?.abort(new Error('Run cancelled'));
    return;
  }

  if (message.type === 'start') {
    void startRun(message).catch((error: unknown) => {
      postStatus('failed', getErrorMessage(error));
    });
  }
});

async function startRun(message: AgentRunnerWorkerStartMessage): Promise<void> {
  const { run: agentRun, profile, worktreePath } = message.payload;
  abortController = new AbortController();
  fs.mkdirSync(path.dirname(agentRun.logFilePath), { recursive: true });

  postStatus('running', 'Run started');
  await createWorktree(agentRun.workspacePath, worktreePath, agentRun.branchName);

  try {
    const result = await run({
      agent: agentRun.provider === 'claude-code'
        ? claudeCode(agentRun.model, { captureSessions: false })
        : codex(agentRun.model, { captureSessions: false }),
      sandbox: docker({
        imageName: profile.imageName,
        containerUid: process.getuid?.() ?? 1000,
        containerGid: process.getgid?.() ?? 1000,
        mounts: toAuthMounts(agentRun.provider, profile),
      }),
      cwd: worktreePath,
      prompt: agentRun.prompt,
      maxIterations: agentRun.maxIterations,
      branchStrategy: { type: 'head' },
      logging: {
        type: 'file',
        path: agentRun.logFilePath,
        onAgentStreamEvent: (event) => {
          postStreamEvent(event);
        },
      },
      hooks: toAuthHooks(agentRun.provider, profile),
      signal: abortController.signal,
    });

    for (const commit of result.commits) {
      postMessage({ type: 'commit', sha: commit.sha });
    }
    postStatus('succeeded', 'Run completed');
  } catch (error: unknown) {
    if (abortController.signal.aborted) {
      postStatus('cancelled', 'Run cancelled');
      return;
    }

    postStatus('failed', getErrorMessage(error));
  }
}

async function createWorktree(
  workspacePath: string,
  worktreePath: string,
  branchName: string,
): Promise<void> {
  fs.mkdirSync(path.dirname(worktreePath), { recursive: true });
  await execGit(workspacePath, ['worktree', 'add', '-b', branchName, worktreePath, 'HEAD']);
}

function execGit(cwd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile('git', args, { cwd, encoding: 'utf8' }, (error, _stdout, stderr) => {
      if (error) {
        reject(new Error((stderr || error.message).trim()));
        return;
      }

      resolve();
    });
  });
}

function toAuthMounts(
  provider: 'claude-code' | 'codex',
  profile: AgentRunnerWorkerStartMessage['payload']['profile'],
): MountConfig[] {
  const auth = provider === 'claude-code'
    ? {
      enabled: profile.claudeAuthMountEnabled,
      sandboxPath: '/mnt/agent-auth/claude',
    }
    : {
      enabled: profile.codexAuthMountEnabled,
      sandboxPath: '/mnt/agent-auth/codex',
    };

  if (!auth.enabled) {
    return [];
  }

  const hostPath = assertCliAuthPath(provider);

  return [{ hostPath, sandboxPath: auth.sandboxPath, readonly: true }];
}

function toAuthHooks(
  provider: 'claude-code' | 'codex',
  profile: AgentRunnerWorkerStartMessage['payload']['profile'],
) {
  const enabled = provider === 'claude-code'
    ? profile.claudeAuthMountEnabled
    : profile.codexAuthMountEnabled;

  if (!enabled) {
    return undefined;
  }

  const source = provider === 'claude-code'
    ? '/mnt/agent-auth/claude'
    : '/mnt/agent-auth/codex';
  const destination = provider === 'claude-code'
    ? '/home/agent/.claude'
    : '/home/agent/.codex';

  return {
    sandbox: {
      onSandboxReady: [
        {
          command: `mkdir -p ${destination} && cp -R ${source}/. ${destination}/ && chmod -R u+rwX ${destination}`,
        },
      ],
    },
  };
}

function postStreamEvent(event: AgentStreamEvent): void {
  if (event.type === 'text') {
    postMessage({
      type: 'event',
      eventType: 'log',
      message: event.message,
      createdAt: event.timestamp.getTime(),
    });
    return;
  }

  postMessage({
    type: 'event',
    eventType: 'tool',
    message: `${event.name} ${event.formattedArgs}`,
    createdAt: event.timestamp.getTime(),
  });
}

function postStatus(status: 'running' | 'succeeded' | 'failed' | 'cancelled', message: string): void {
  postMessage({
    type: 'status',
    status,
    message,
    createdAt: Date.now(),
  });
}

function postMessage(message: AgentRunnerWorkerOutboundMessage): void {
  parentPort.postMessage(message);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
