import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type {
  AgentProviderAuthState,
  AgentProviderAuthStatus,
  AgentProviderId,
  AgentRuntimeProfile,
} from '@/core/agent-runtime/domain';
import { AppError } from '@/shared/app-errors';

const AGENT_AUTH_PROVIDERS: AgentProviderId[] = ['claude-code', 'codex'];
const AUTH_CHECK_TIMEOUT_MS = 5000;

export type ProviderAuthCommandInput = {
  command: string;
  args: string[];
  timeoutMs: number;
};

export type ProviderAuthCommandResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
  errorCode?: string;
  timedOut?: boolean;
};

export type ProviderAuthCommandRunner = (
  input: ProviderAuthCommandInput,
) => Promise<ProviderAuthCommandResult>;

export type ListProviderAuthStatusesOptions = {
  commandRunner?: ProviderAuthCommandRunner;
  now?: () => number;
};

export function getCliAuthHostPath(provider: AgentProviderId): string {
  return path.join(os.homedir(), provider === 'claude-code' ? '.claude' : '.codex');
}

export function assertRuntimeProfileAuthAvailable(
  profile: AgentRuntimeProfile,
  provider?: AgentProviderId,
): void {
  if ((!provider || provider === 'claude-code') && profile.claudeAuthMountEnabled) {
    assertCliAuthPath('claude-code');
  }

  if ((!provider || provider === 'codex') && profile.codexAuthMountEnabled) {
    assertCliAuthPath('codex');
  }
}

export function listProviderAuthStatuses(
  options: ListProviderAuthStatusesOptions = {},
): Promise<AgentProviderAuthStatus[]> {
  const checkedAt = options.now?.() ?? Date.now();
  const commandRunner = options.commandRunner ?? runProviderAuthCommand;

  return Promise.all(
    AGENT_AUTH_PROVIDERS.map((provider) => (
      getProviderAuthStatus(provider, checkedAt, commandRunner)
    )),
  );
}

export function assertCliAuthPath(provider: AgentProviderId): string {
  const result = validateCliAuthPath(provider);

  if (!result.ok) {
    throw new AppError('AUTH_MISSING', result.message);
  }

  return result.path;
}

function validateCliAuthPath(provider: AgentProviderId): {
  ok: true;
  path: string;
} | {
  ok: false;
  path: string;
  message: string;
} {
  const expectedPath = path.resolve(getCliAuthHostPath(provider));
  const label = provider === 'claude-code' ? 'Claude' : 'Codex';

  try {
    if (!fs.existsSync(expectedPath)) {
      return {
        ok: false,
        path: expectedPath,
        message: `${label} CLI auth directory not found at ${expectedPath}.`,
      };
    }

    if (fs.lstatSync(expectedPath).isSymbolicLink()) {
      return {
        ok: false,
        path: expectedPath,
        message: `${label} CLI auth directory must not be a symlink: ${expectedPath}.`,
      };
    }

    if (!fs.statSync(expectedPath).isDirectory()) {
      return {
        ok: false,
        path: expectedPath,
        message: `${label} CLI auth path must be a directory: ${expectedPath}.`,
      };
    }

    const realPath = fs.realpathSync(expectedPath);

    if (realPath !== expectedPath) {
      return {
        ok: false,
        path: expectedPath,
        message: `${label} CLI auth directory must not be a symlink: ${expectedPath}.`,
      };
    }

    return { ok: true, path: expectedPath };
  } catch {
    return {
      ok: false,
      path: expectedPath,
      message: `${label} CLI auth directory cannot be read at ${expectedPath}.`,
    };
  }
}

async function getProviderAuthStatus(
  provider: AgentProviderId,
  checkedAt: number,
  commandRunner: ProviderAuthCommandRunner,
): Promise<AgentProviderAuthStatus> {
  const cliVersion = await getProviderCliVersion(provider, commandRunner);
  const authPath = validateCliAuthPath(provider);

  if (!authPath.ok) {
    return toProviderAuthStatus(
      provider,
      authPath.path,
      cliVersion,
      'missing',
      authPath.message,
      checkedAt,
    );
  }

  const command = toProviderAuthCommand(provider);

  try {
    const result = await commandRunner({
      ...command,
      timeoutMs: AUTH_CHECK_TIMEOUT_MS,
    });
    return toProviderCommandStatus(provider, authPath.path, cliVersion, result, checkedAt);
  } catch {
    return toProviderAuthStatus(
      provider,
      authPath.path,
      cliVersion,
      'unknown',
      'Unable to verify CLI auth.',
      checkedAt,
    );
  }
}

function runProviderAuthCommand(input: ProviderAuthCommandInput): Promise<ProviderAuthCommandResult> {
  return new Promise((resolve) => {
    execFile(
      input.command,
      input.args,
      {
        encoding: 'utf8',
        timeout: input.timeoutMs,
      },
      (error, stdout, stderr) => {
        if (!error) {
          resolve({ exitCode: 0, stdout, stderr });
          return;
        }

        const execError = error as NodeJS.ErrnoException & {
          killed?: boolean;
          signal?: NodeJS.Signals;
        };
        const errorCode = typeof execError.code === 'string' ? execError.code : undefined;
        resolve({
          exitCode: typeof execError.code === 'number' ? execError.code : 1,
          stdout,
          stderr,
          errorCode,
          timedOut: execError.killed === true && execError.signal === 'SIGTERM',
        });
      },
    );
  });
}

function toProviderCommandStatus(
  provider: AgentProviderId,
  cliAuthPath: string,
  cliVersion: string | null,
  result: ProviderAuthCommandResult,
  checkedAt: number,
): AgentProviderAuthStatus {
  if (result.timedOut) {
    return toProviderAuthStatus(
      provider,
      cliAuthPath,
      cliVersion,
      'unknown',
      'Auth check timed out.',
      checkedAt,
    );
  }

  if (result.errorCode === 'ENOENT') {
    return toProviderAuthStatus(
      provider,
      cliAuthPath,
      cliVersion,
      'unknown',
      'CLI not found.',
      checkedAt,
    );
  }

  if (result.exitCode === 0) {
    if (provider === 'claude-code' && !isJsonObject(result.stdout)) {
      return toProviderAuthStatus(
        provider,
        cliAuthPath,
        cliVersion,
        'unknown',
        'Unable to verify CLI auth.',
        checkedAt,
      );
    }

    return toProviderAuthStatus(
      provider,
      cliAuthPath,
      cliVersion,
      'valid',
      'Authenticated.',
      checkedAt,
    );
  }

  if (isAuthFailureOutput(result.stdout) || isAuthFailureOutput(result.stderr)) {
    return toProviderAuthStatus(
      provider,
      cliAuthPath,
      cliVersion,
      'invalid',
      'Login expired or unavailable.',
      checkedAt,
    );
  }

  return toProviderAuthStatus(
    provider,
    cliAuthPath,
    cliVersion,
    'unknown',
    'Unable to verify CLI auth.',
    checkedAt,
  );
}

async function getProviderCliVersion(
  provider: AgentProviderId,
  commandRunner: ProviderAuthCommandRunner,
): Promise<string | null> {
  const command = toProviderVersionCommand(provider);

  try {
    const result = await commandRunner({
      ...command,
      timeoutMs: AUTH_CHECK_TIMEOUT_MS,
    });

    if (result.exitCode !== 0 || result.errorCode === 'ENOENT' || result.timedOut) {
      return null;
    }

    return parseVersionOutput(result.stdout, result.stderr);
  } catch {
    return null;
  }
}

function toProviderAuthCommand(provider: AgentProviderId): {
  command: string;
  args: string[];
} {
  return provider === 'claude-code'
    ? { command: 'claude', args: ['auth', 'status', '--json'] }
    : { command: 'codex', args: ['login', 'status'] };
}

function toProviderVersionCommand(provider: AgentProviderId): {
  command: string;
  args: string[];
} {
  return provider === 'claude-code'
    ? { command: 'claude', args: ['--version'] }
    : { command: 'codex', args: ['--version'] };
}

function toProviderAuthStatus(
  provider: AgentProviderId,
  cliAuthPath: string,
  cliVersion: string | null,
  state: AgentProviderAuthState,
  message: string,
  checkedAt: number,
): AgentProviderAuthStatus {
  return {
    provider,
    label: toProviderLabel(provider),
    cliAuthPath,
    cliVersion,
    state,
    connected: state === 'valid',
    message,
    checkedAt,
  };
}

function parseVersionOutput(stdout: string, stderr: string): string | null {
  const line = [...stdout.split('\n'), ...stderr.split('\n')]
    .map((value) => value.trim())
    .find((value) => value && !value.toLowerCase().startsWith('warning:'));

  if (!line) {
    return null;
  }

  return line.slice(0, 120);
}

function isJsonObject(value: string): boolean {
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed);
  } catch {
    return false;
  }
}

function isAuthFailureOutput(value: string): boolean {
  const lowerValue = value.toLowerCase();
  return [
    'auth',
    'credential',
    'expired',
    'forbidden',
    'login',
    'not authenticated',
    'not logged',
    'token',
    'unauthorized',
  ].some((pattern) => lowerValue.includes(pattern));
}

function toProviderLabel(provider: AgentProviderId): string {
  return provider === 'claude-code' ? 'Claude Code' : 'Codex';
}
