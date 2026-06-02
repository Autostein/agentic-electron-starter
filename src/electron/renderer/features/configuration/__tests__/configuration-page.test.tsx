// @vitest-environment jsdom

import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import type {
  AgentProviderAuthStatusResult,
  AgentRuntimeProfileResult,
} from '@/contracts/ipc/agent-runtime.contract';
import type { DesktopApi } from '@/contracts/ipc/shared/desktop-api';
import type { WorkspaceSummaryResult } from '@/contracts/ipc/workspaces.contract';
import { AppShell } from '../../../routes/AppShell';
import {
  RuntimeConfigurationRedirectRoute,
  WorkspaceConfigurationRedirectRoute,
} from '../../../routes/ConfigurationRedirectRoutes';
import { renderWithQuery } from '../../../shared/testing/render-with-query';
import { WorkspacesPage } from '../../workspaces/ui/WorkspacesPage';
import { ConfigurationPage } from '../ui/ConfigurationPage';

vi.mock('@uiw/react-codemirror', () => ({
  default: ({
    value,
    onChange,
    editable,
    'aria-label': ariaLabel,
  }: {
    value: string;
    onChange?: (value: string) => void;
    editable?: boolean;
    'aria-label'?: string;
  }) => (
    <textarea
      aria-label={ariaLabel ?? 'Dockerfile editor'}
      value={value}
      readOnly={!editable}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
}));

describe('ConfigurationPage', () => {
  let workspaces: WorkspaceSummaryResult[];
  let profiles: AgentRuntimeProfileResult[];
  let providerAuthStatuses: AgentProviderAuthStatusResult[];
  let dockerfiles: Map<string, string>;

  beforeEach(() => {
    workspaces = [
      {
        id: 'workspace-1',
        name: 'repo',
        folderCount: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    ];
    profiles = [
      {
        id: 'starter',
        name: 'Starter',
        sourceKind: 'bundled-starter',
        profilePath: null,
        imageName: 'agentic:starter',
        claudeAuthMountEnabled: false,
        codexAuthMountEnabled: false,
        createdAt: 1,
        updatedAt: 1,
      },
    ];
    providerAuthStatuses = [
      {
        provider: 'claude-code',
        label: 'Claude Code',
        cliAuthPath: '/Users/dev/.claude',
        cliVersion: '2.1.148 (Claude Code)',
        state: 'valid',
        connected: true,
        message: 'Authenticated.',
        checkedAt: 100,
      },
      {
        provider: 'codex',
        label: 'Codex',
        cliAuthPath: '/Users/dev/.codex',
        cliVersion: 'codex-cli 0.130.0',
        state: 'missing',
        connected: false,
        message: 'Codex CLI auth directory not found at /Users/dev/.codex.',
        checkedAt: 100,
      },
      {
        provider: 'claude-code',
        label: 'Claude Code',
        cliAuthPath: '/Users/dev/.claude',
        cliVersion: '2.1.148 (Claude Code)',
        state: 'invalid',
        connected: false,
        message: 'Login expired or unavailable.',
        checkedAt: 100,
      },
      {
        provider: 'codex',
        label: 'Codex',
        cliAuthPath: '/Users/dev/.codex',
        cliVersion: null,
        state: 'unknown',
        connected: false,
        message: 'CLI not found.',
        checkedAt: 100,
      },
    ];
    dockerfiles = new Map([['starter', 'FROM starter\n']]);

    window.desktop = {
      appInfo: {
        get: vi.fn(),
      },
      workspaces: {
        create: vi.fn(),
        update: vi.fn(),
        list: vi.fn(async () => workspaces),
        get: vi.fn(),
        pickFolder: vi.fn(),
        updateFolder: vi.fn(),
        removeFolder: vi.fn(),
      },
      agentRuns: {
        start: vi.fn(),
        list: vi.fn(),
        get: vi.fn(),
        getCommitDetails: vi.fn(),
        getCommitFileDiff: vi.fn(),
        cancel: vi.fn(),
        onEvent: vi.fn(() => () => undefined),
      },
      agentRuntime: {
        listProviderAuthStatuses: vi.fn(async () => providerAuthStatuses),
        listProfiles: vi.fn(async () => profiles),
        getProfile: vi.fn(),
        updateProfile: vi.fn(async (input) => {
          const profile = profiles.find((item) => item.id === input.id);

          if (!profile) {
            throw new Error('Runtime profile not found.');
          }

          Object.assign(profile, input, { updatedAt: 2 });
          return profile;
        }),
        duplicateStarterProfile: vi.fn(async () => {
          const starter = profiles[0] as AgentRuntimeProfileResult;
          const profile: AgentRuntimeProfileResult = {
            ...starter,
            id: 'copy-1',
            name: 'Starter copy',
            sourceKind: 'user-managed-copy',
            profilePath: '/userData/agent-runtime-profiles/copy-1',
            imageName: 'agentic:copy-1',
            createdAt: 2,
            updatedAt: 2,
          };
          profiles = [...profiles, profile];
          dockerfiles.set(profile.id, dockerfiles.get('starter') ?? '');
          return profile;
        }),
        getProfileDockerfile: vi.fn(async ({ profileId }) => {
          const profile = profiles.find((item) => item.id === profileId);

          if (!profile) {
            throw new Error('Runtime profile not found.');
          }

          return {
            profileId,
            content: dockerfiles.get(profileId) ?? '',
            editable: profile.sourceKind === 'user-managed-copy',
            path: profile.profilePath
              ? `${profile.profilePath}/Dockerfile`
              : '/resources/sandcastle/Dockerfile',
          };
        }),
        updateProfileDockerfile: vi.fn(async ({ profileId, content }) => {
          dockerfiles.set(profileId, content);
          return { profileId, content, savedAt: 200 };
        }),
        resetProfileDockerfile: vi.fn(async ({ profileId }) => {
          const content = dockerfiles.get('starter') ?? '';
          dockerfiles.set(profileId, content);
          return { profileId, content, savedAt: 200 };
        }),
        openProfileFolder: vi.fn(async () => undefined),
        getImageStatus: vi.fn(async ({ profileId }) => ({
          imageName: profileId === 'copy-1' ? 'agentic:copy-1' : 'agentic:starter',
          available: true,
          checkedAt: 123,
        })),
        buildImage: vi.fn(async ({ profileId }) => ({
          imageName: profileId === 'copy-1' ? 'agentic:copy-1' : 'agentic:starter',
          succeeded: true,
        })),
        onBuildEvent: vi.fn(() => () => undefined),
      },
      notes: {
        list: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
    } satisfies DesktopApi;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('defaults to the Runtimes tab', async () => {
    renderConfigurationPage('/configuration');

    expect(await screen.findByRole('heading', { name: 'Configuration' })).toBeTruthy();
    expect(await screen.findByRole('heading', { name: 'Runtimes' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Duplicate starter' })).toBeTruthy();
  });

  it('shows Runtimes from the runtimes tab and legacy settings redirect', async () => {
    renderConfigurationPage('/settings');

    expect(await screen.findByRole('heading', { name: 'Runtimes' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Duplicate starter' })).toBeTruthy();
  });

  it('shows provider auth status from the providers tab', async () => {
    renderConfigurationPage('/configuration?tab=providers');

    expect(await screen.findByRole('heading', { name: 'Providers' })).toBeTruthy();
    expect(screen.getAllByText('Claude Code')).toHaveLength(2);
    expect(screen.getAllByText('/Users/dev/.claude')).toHaveLength(2);
    expect(screen.getAllByText('CLI 2.1.148 (Claude Code)')).toHaveLength(2);
    expect(screen.getByText('CLI codex-cli 0.130.0')).toBeTruthy();
    expect(screen.getByText('CLI not installed')).toBeTruthy();
    expect(screen.getByText('Connected')).toBeTruthy();
    expect(screen.getAllByText('Codex')).toHaveLength(2);
    expect(screen.getByText('Missing')).toBeTruthy();
    expect(screen.getByText('Invalid')).toBeTruthy();
    expect(screen.getByText('Unknown')).toBeTruthy();
    expect(screen.getAllByText(/Last checked/)).toHaveLength(4);

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

    await waitFor(() => {
      expect(window.desktop.agentRuntime.listProviderAuthStatuses).toHaveBeenCalledTimes(2);
    });
  });

  it('redirects legacy projects route to Workspaces', async () => {
    renderConfigurationPage('/projects');

    expect(await screen.findByRole('heading', { name: 'Workspaces' })).toBeTruthy();
    expect(await screen.findByText('1 folder')).toBeTruthy();
  });

  it('redirects the legacy workspaces configuration tab to Workspaces', async () => {
    renderConfigurationPage('/configuration?tab=workspaces');

    expect(await screen.findByRole('heading', { name: 'Workspaces' })).toBeTruthy();
    expect(await screen.findByText('1 folder')).toBeTruthy();
  });

  it('blocks tab switching with dirty Dockerfile edits', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderConfigurationPage('/configuration?tab=runtimes');

    fireEvent.click(await screen.findByRole('button', { name: 'Duplicate starter' }));
    expect(await screen.findByDisplayValue('Starter copy')).toBeTruthy();
    fireEvent.change(await screen.findByLabelText('Dockerfile editor'), {
      target: { value: 'FROM unsaved\n' },
    });
    fireEvent.click(screen.getByRole('link', { name: 'Workspaces' }));

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('Discard unsaved Dockerfile changes?');
    });
    expect(screen.getByRole('heading', { name: 'Runtimes' })).toBeTruthy();
    expect(screen.getByText('Unsaved')).toBeTruthy();
  });

  it('shows a single Configuration sidebar item', () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: <AppShell />,
        children: [
          { index: true, element: <p>Home</p> },
          { path: 'configuration', element: <ConfigurationPage /> },
        ],
      },
    ]);

    renderWithQuery(<RouterProvider router={router} />);

    expect(screen.getByRole('link', { name: 'Configuration' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Workspaces' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Runtimes' })).toBeNull();
  });
});

function renderConfigurationPage(initialEntry: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <AppShell />,
        children: [
          { path: 'configuration', element: <ConfigurationPage /> },
          { path: 'projects', element: <WorkspaceConfigurationRedirectRoute /> },
          { path: 'workspaces', element: <WorkspacesPage /> },
          { path: 'settings', element: <RuntimeConfigurationRedirectRoute /> },
        ],
      },
    ],
    { initialEntries: [initialEntry] },
  );

  return renderWithQuery(<RouterProvider router={router} />);
}
