import { describe, expect, it } from 'vitest';
import type { AgentRun, AgentRunContextFolder } from '@/core/agent-runs/domain';
import type { AgentRuntimeProfile } from '@/core/agent-runtime/domain';
import { createAgentRunSandboxConfig } from '../agent-run-sandbox-config';

const baseRun: AgentRun = {
  id: 'run-1',
  workspaceId: 'workspace-1',
  workspaceName: 'Website',
  targetFolderId: 'folder-app',
  targetFolderPath: '/repo/app',
  targetFolderLabel: 'Application',
  runtimeProfileId: 'profile-1',
  runtimeProfileName: 'Starter',
  runtimeImageName: 'agentic:test',
  provider: 'codex',
  model: 'gpt-5.4',
  prompt: 'Implement it',
  maxIterations: 1,
  status: 'queued',
  branchName: 'agentic/run-1',
  logFilePath: '/logs/run-1.log',
  createdAt: 100,
  startedAt: null,
  finishedAt: null,
  errorMessage: null,
};

const baseProfile: AgentRuntimeProfile = {
  id: 'profile-1',
  name: 'Starter',
  sourceKind: 'bundled-starter',
  profilePath: null,
  imageName: 'agentic:test',
  claudeAuthMountEnabled: false,
  codexAuthMountEnabled: false,
  createdAt: 100,
  updatedAt: 100,
};

const contextFolders: AgentRunContextFolder[] = [
  {
    id: 'folder-api',
    label: 'API',
    path: '/repo/api',
    sandboxPath: '/mnt/agentic/context/folder-api',
  },
  {
    id: 'folder-docs',
    label: 'Docs',
    path: '/repo/docs',
    sandboxPath: "/mnt/agentic/context/docs'quoted",
  },
];

describe('agent run sandbox config', () => {
  it('builds read-only context mounts and prompt metadata', () => {
    const config = createAgentRunSandboxConfig({
      run: baseRun,
      profile: baseProfile,
      contextFolders,
    });

    expect(config.mounts).toEqual([
      {
        hostPath: '/repo/api',
        sandboxPath: '/mnt/agentic/context/folder-api',
        readonly: true,
      },
      {
        hostPath: '/repo/docs',
        sandboxPath: "/mnt/agentic/context/docs'quoted",
        readonly: true,
      },
    ]);
    expect(config.env).toBeUndefined();
    expect(config.prompt).toBe([
      'Agentic workspace context:',
      'Writable target repo: Application',
      'Writable host path: /repo/app',
      'Writable sandbox path: /home/agent/workspace',
      'Read-only context repos:',
      '- API: host /repo/api, sandbox /mnt/agentic/context/folder-api',
      "- Docs: host /repo/docs, sandbox /mnt/agentic/context/docs'quoted",
      '',
      'User task:',
      'Implement it',
    ].join('\n'));
  });

  it('adds provider auth mounts and sandbox ready hooks when auth is enabled', () => {
    const config = createAgentRunSandboxConfig({
      run: { ...baseRun, provider: 'claude-code' },
      profile: { ...baseProfile, claudeAuthMountEnabled: true },
      contextFolders: [contextFolders[0] as AgentRunContextFolder],
      resolveAuthHostPath: () => '/Users/dev/.claude',
    });

    expect(config.mounts).toEqual([
      {
        hostPath: '/Users/dev/.claude',
        sandboxPath: '/mnt/agent-auth/claude',
        readonly: true,
      },
      {
        hostPath: '/repo/api',
        sandboxPath: '/mnt/agentic/context/folder-api',
        readonly: true,
      },
    ]);
    expect(config.hooks).toEqual({
      sandbox: {
        onSandboxReady: [
          {
            command: [
              'mkdir -p /home/agent/.claude && cp -R /mnt/agent-auth/claude/. /home/agent/.claude/ && chmod -R u+rwX /home/agent/.claude',
              "git config --global --add safe.directory '/mnt/agentic/context/folder-api'",
            ].join(' && '),
          },
        ],
      },
    });
  });

  it('omits hooks when auth and context folders are absent', () => {
    const config = createAgentRunSandboxConfig({
      run: baseRun,
      profile: baseProfile,
      contextFolders: [],
    });

    expect(config.mounts).toEqual([]);
    expect(config.hooks).toBeUndefined();
    expect(config.prompt).toContain('Read-only context repos: none');
  });

  it('quotes context safe-directory paths in sandbox hooks', () => {
    const config = createAgentRunSandboxConfig({
      run: baseRun,
      profile: baseProfile,
      contextFolders: [contextFolders[1] as AgentRunContextFolder],
    });

    expect(config.hooks).toEqual({
      sandbox: {
        onSandboxReady: [
          {
            command: "git config --global --add safe.directory '/mnt/agentic/context/docs'\\''quoted'",
          },
        ],
      },
    });
  });
});
