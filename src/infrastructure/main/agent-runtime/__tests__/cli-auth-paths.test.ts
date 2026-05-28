import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  assertCliAuthPath,
  listProviderAuthStatuses,
  type ProviderAuthCommandRunner,
} from '../cli-auth-paths';

describe('cli auth paths', () => {
  let tempPath: string;

  beforeEach(() => {
    tempPath = fs.mkdtempSync('/private/tmp/provider-auth-');
    vi.spyOn(os, 'homedir').mockReturnValue(tempPath);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(tempPath, { recursive: true, force: true });
  });

  it('returns valid statuses when provider CLI checks succeed', async () => {
    createAuthDir('.claude');
    createAuthDir('.codex');
    const calls: Array<{ command: string; args: string[]; timeoutMs: number }> = [];
    const commandRunner: ProviderAuthCommandRunner = async (input) => {
      calls.push(input);

      if (input.args.includes('--version')) {
        return {
          exitCode: 0,
          stdout: input.command === 'claude' ? '2.1.148 (Claude Code)' : 'codex-cli 0.130.0',
          stderr: input.command === 'codex' ? 'WARNING: ignored\n' : '',
        };
      }

      return {
        exitCode: 0,
        stdout: input.command === 'claude' ? '{"status":"ok"}' : 'Logged in',
        stderr: '',
      };
    };

    const statuses = await listProviderAuthStatuses({ commandRunner, now: () => 123 });

    expect(statuses).toEqual([
      {
        provider: 'claude-code',
        label: 'Claude Code',
        cliAuthPath: path.join(tempPath, '.claude'),
        cliVersion: '2.1.148 (Claude Code)',
        state: 'valid',
        connected: true,
        message: 'Authenticated.',
        checkedAt: 123,
      },
      {
        provider: 'codex',
        label: 'Codex',
        cliAuthPath: path.join(tempPath, '.codex'),
        cliVersion: 'codex-cli 0.130.0',
        state: 'valid',
        connected: true,
        message: 'Authenticated.',
        checkedAt: 123,
      },
    ]);
    expect(calls).toEqual([
      { command: 'claude', args: ['--version'], timeoutMs: 5000 },
      { command: 'codex', args: ['--version'], timeoutMs: 5000 },
      { command: 'claude', args: ['auth', 'status', '--json'], timeoutMs: 5000 },
      { command: 'codex', args: ['login', 'status'], timeoutMs: 5000 },
    ]);
  });

  it('returns missing statuses and still reports CLI versions when auth paths are absent', async () => {
    const commandRunner: ProviderAuthCommandRunner = async (input) => ({
      exitCode: 0,
      stdout: input.command === 'claude' ? '2.1.148 (Claude Code)' : 'codex-cli 0.130.0',
      stderr: '',
    });

    const statuses = await listProviderAuthStatuses({ commandRunner, now: () => 123 });

    expect(statuses.map((status) => status.state)).toEqual(['missing', 'missing']);
    expect(statuses.map((status) => status.connected)).toEqual([false, false]);
    expect(statuses.map((status) => status.cliVersion)).toEqual([
      '2.1.148 (Claude Code)',
      'codex-cli 0.130.0',
    ]);
  });

  it('treats symlinked auth directories as missing for status checks', async () => {
    const realClaudePath = path.join(tempPath, 'real-claude');
    fs.mkdirSync(realClaudePath);
    fs.symlinkSync(realClaudePath, path.join(tempPath, '.claude'), 'dir');
    createAuthDir('.codex');
    const commandRunner: ProviderAuthCommandRunner = async () => ({
      exitCode: 0,
      stdout: 'Logged in',
      stderr: '',
    });

    const statuses = await listProviderAuthStatuses({ commandRunner, now: () => 123 });

    expect(statuses[0]).toMatchObject({
      provider: 'claude-code',
      state: 'missing',
      connected: false,
    });
    expect(statuses[0]?.message).toContain('must not be a symlink');
    expect(statuses[1]).toMatchObject({
      provider: 'codex',
      state: 'valid',
      connected: true,
    });
  });

  it('returns unknown when the provider CLI is not installed', async () => {
    createAuthDir('.claude');
    createAuthDir('.codex');
    const commandRunner: ProviderAuthCommandRunner = async () => ({
      exitCode: 1,
      stdout: '',
      stderr: '',
      errorCode: 'ENOENT',
    });

    const statuses = await listProviderAuthStatuses({ commandRunner, now: () => 123 });

    expect(statuses.map((status) => status.state)).toEqual(['unknown', 'unknown']);
    expect(statuses.map((status) => status.message)).toEqual(['CLI not found.', 'CLI not found.']);
  });

  it('returns unknown when provider CLI checks time out', async () => {
    createAuthDir('.claude');
    createAuthDir('.codex');
    const commandRunner: ProviderAuthCommandRunner = async () => ({
      exitCode: 1,
      stdout: '',
      stderr: '',
      timedOut: true,
    });

    const statuses = await listProviderAuthStatuses({ commandRunner, now: () => 123 });

    expect(statuses.map((status) => status.state)).toEqual(['unknown', 'unknown']);
    expect(statuses.map((status) => status.message)).toEqual([
      'Auth check timed out.',
      'Auth check timed out.',
    ]);
  });

  it('returns invalid when provider CLI checks report auth failures', async () => {
    createAuthDir('.claude');
    createAuthDir('.codex');
    const commandRunner: ProviderAuthCommandRunner = async () => ({
      exitCode: 1,
      stdout: '',
      stderr: 'not logged in',
    });

    const statuses = await listProviderAuthStatuses({ commandRunner, now: () => 123 });

    expect(statuses.map((status) => status.state)).toEqual(['invalid', 'invalid']);
    expect(statuses.map((status) => status.connected)).toEqual([false, false]);
    expect(statuses.map((status) => status.message)).toEqual([
      'Login expired or unavailable.',
      'Login expired or unavailable.',
    ]);
  });

  it('returns unknown when Claude auth status output is not parseable JSON', async () => {
    createAuthDir('.claude');
    createAuthDir('.codex');
    const commandRunner: ProviderAuthCommandRunner = async (input) => ({
      exitCode: 0,
      stdout: input.command === 'claude' ? 'ok' : 'Logged in',
      stderr: '',
    });

    const statuses = await listProviderAuthStatuses({ commandRunner, now: () => 123 });

    expect(statuses[0]).toMatchObject({
      provider: 'claude-code',
      state: 'unknown',
      connected: false,
      message: 'Unable to verify CLI auth.',
    });
    expect(statuses[1]).toMatchObject({
      provider: 'codex',
      state: 'valid',
      connected: true,
    });
  });

  it('keeps the mount-safety assertion as a path-only check', () => {
    createAuthDir('.claude');

    expect(assertCliAuthPath('claude-code')).toBe(path.join(tempPath, '.claude'));
  });

  function createAuthDir(name: '.claude' | '.codex'): void {
    fs.mkdirSync(path.join(tempPath, name));
  }
});
