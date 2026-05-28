import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AgentProviderId, AgentRuntimeProfile } from '@/core/agent-runtime/domain';

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

export function assertCliAuthPath(provider: AgentProviderId): string {
  const expectedPath = path.resolve(getCliAuthHostPath(provider));
  const label = provider === 'claude-code' ? 'Claude' : 'Codex';

  if (!fs.existsSync(expectedPath)) {
    throw new Error(`${label} CLI auth directory not found at ${expectedPath}.`);
  }

  const realPath = fs.realpathSync(expectedPath);

  if (realPath !== expectedPath) {
    throw new Error(`${label} CLI auth directory must not be a symlink: ${expectedPath}.`);
  }

  if (!fs.statSync(expectedPath).isDirectory()) {
    throw new Error(`${label} CLI auth path must be a directory: ${expectedPath}.`);
  }

  return expectedPath;
}
