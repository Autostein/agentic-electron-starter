import type { MountConfig, SandboxHooks } from '@ai-hero/sandcastle';
import type { AgentRun, AgentRunContextFolder } from '@/core/agent-runs/domain';
import type { AgentProviderId, AgentRuntimeProfile } from '@/core/agent-runtime/domain';
import { assertCliAuthPath } from '@/infrastructure/main/agent-runtime/cli-auth-paths';

export type AgentRunSandboxConfig = {
  mounts: MountConfig[];
  env: Record<string, string> | undefined;
  hooks: SandboxHooks | undefined;
  prompt: string;
};

export type AgentRunSandboxConfigInput = {
  run: AgentRun;
  profile: AgentRuntimeProfile;
  contextFolders: AgentRunContextFolder[];
  resolveAuthHostPath?: (provider: AgentProviderId) => string;
};

export function createAgentRunSandboxConfig(
  input: AgentRunSandboxConfigInput,
): AgentRunSandboxConfig {
  const resolveAuthHostPath = input.resolveAuthHostPath ?? assertCliAuthPath;

  return {
    mounts: [
      ...toAuthMounts(input.run.provider, input.profile, resolveAuthHostPath),
      ...toContextMounts(input.contextFolders),
    ],
    env: toSandboxEnv(),
    hooks: toSandboxHooks(input.run.provider, input.profile, input.contextFolders),
    prompt: toRunPrompt(input.run, input.contextFolders),
  };
}

function toAuthMounts(
  provider: AgentProviderId,
  profile: AgentRuntimeProfile,
  resolveAuthHostPath: (provider: AgentProviderId) => string,
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

  return [{
    hostPath: resolveAuthHostPath(provider),
    sandboxPath: auth.sandboxPath,
    readonly: true,
  }];
}

function toContextMounts(contextFolders: AgentRunContextFolder[]): MountConfig[] {
  return contextFolders.map((folder) => ({
    hostPath: folder.path,
    sandboxPath: folder.sandboxPath,
    readonly: true,
  }));
}

function toSandboxEnv(): Record<string, string> | undefined {
  return undefined;
}

function toAuthHookCommands(provider: AgentProviderId, profile: AgentRuntimeProfile): string[] {
  const enabled = provider === 'claude-code'
    ? profile.claudeAuthMountEnabled
    : profile.codexAuthMountEnabled;

  if (!enabled) {
    return [];
  }

  const source = provider === 'claude-code'
    ? '/mnt/agent-auth/claude'
    : '/mnt/agent-auth/codex';
  const destination = provider === 'claude-code'
    ? '/home/agent/.claude'
    : '/home/agent/.codex';

  return [
    `mkdir -p ${destination} && cp -R ${source}/. ${destination}/ && chmod -R u+rwX ${destination}`,
  ];
}

function toSandboxHooks(
  provider: AgentProviderId,
  profile: AgentRuntimeProfile,
  contextFolders: AgentRunContextFolder[],
): SandboxHooks | undefined {
  const readyCommands = [
    ...toAuthHookCommands(provider, profile),
    ...contextFolders.map((folder) => (
      `git config --global --add safe.directory ${quoteShell(folder.sandboxPath)}`
    )),
  ];

  if (readyCommands.length === 0) {
    return undefined;
  }

  return {
    sandbox: {
      onSandboxReady: [{ command: readyCommands.join(' && ') }],
    },
  };
}

function toRunPrompt(agentRun: AgentRun, contextFolders: AgentRunContextFolder[]): string {
  const contextLines = contextFolders.length === 0
    ? ['Read-only context repos: none']
    : [
      'Read-only context repos:',
      ...contextFolders.map((folder) => (
        `- ${folder.label}: host ${folder.path}, sandbox ${folder.sandboxPath}`
      )),
    ];

  return [
    'Agentic workspace context:',
    `Writable target repo: ${agentRun.targetFolderLabel}`,
    `Writable host path: ${agentRun.targetFolderPath}`,
    'Writable sandbox path: /home/agent/workspace',
    ...contextLines,
    '',
    'User task:',
    agentRun.prompt,
  ].join('\n');
}

function quoteShell(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
