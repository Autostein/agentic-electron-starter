// @vitest-environment jsdom

import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import type { AgentRuntimeProfileResult } from '@/contracts/ipc/agent-runtime.contract';
import type { DesktopApi } from '@/contracts/ipc/shared/desktop-api';
import { renderWithQuery } from '../../../shared/testing/render-with-query';
import { RuntimesPage } from '../ui/RuntimesPage';

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

describe('RuntimesPage', () => {
  let profiles: AgentRuntimeProfileResult[];
  let dockerfiles: Map<string, string>;

  beforeEach(() => {
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
    dockerfiles = new Map([['starter', 'FROM starter\n']]);

    window.desktop = {
      appInfo: {
        get: vi.fn(),
      },
      workspaces: {
        create: vi.fn(),
        update: vi.fn(),
        list: vi.fn(),
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
        listProviderAuthStatuses: vi.fn(),
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
            sourceKind: 'user-managed-copy' as const,
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

  it('lists runtime profiles, duplicates starter, and builds the selected copy', async () => {
    renderRuntimesPage();

    expect(await screen.findByText('Starter')).toBeTruthy();
    expect(screen.queryByText('Claude model')).toBeNull();
    expect(screen.queryByText('Codex model')).toBeNull();
    expect(await screen.findByRole('button', { name: /duplicate starter to edit/i })).toBeTruthy();
    expect(screen.getByLabelText('Dockerfile editor')).toHaveAttribute('readonly');

    fireEvent.click(screen.getByRole('button', { name: 'Duplicate starter' }));

    expect(await screen.findByText('Starter copy')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /build image/i }));

    await waitFor(() => {
      expect(window.desktop.agentRuntime.buildImage).toHaveBeenCalledWith({
        profileId: 'copy-1',
      });
    });
  });

  it('saves edited copied Dockerfiles before building', async () => {
    renderRuntimesPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Duplicate starter' }));
    expect(await screen.findByDisplayValue('Starter copy')).toBeTruthy();

    fireEvent.change(await screen.findByLabelText('Dockerfile editor'), {
      target: { value: 'FROM custom\n' },
    });

    expect(screen.getByText('Unsaved')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /save & build image/i }));

    await waitFor(() => {
      expect(window.desktop.agentRuntime.updateProfileDockerfile).toHaveBeenCalledWith({
        profileId: 'copy-1',
        content: 'FROM custom\n',
      });
      expect(window.desktop.agentRuntime.buildImage).toHaveBeenCalledWith({
        profileId: 'copy-1',
      });
    });
  });

  it('prevents builds when saving dirty Dockerfiles fails', async () => {
    window.desktop.agentRuntime.updateProfileDockerfile = vi.fn(async () => {
      throw new Error('Cannot save Dockerfile.');
    });

    renderRuntimesPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Duplicate starter' }));
    expect(await screen.findByDisplayValue('Starter copy')).toBeTruthy();
    fireEvent.change(await screen.findByLabelText('Dockerfile editor'), {
      target: { value: 'FROM broken\n' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save & build image/i }));

    expect(await screen.findByText('Cannot save Dockerfile.')).toBeTruthy();
    expect(window.desktop.agentRuntime.buildImage).not.toHaveBeenCalled();
  });

  it('blocks profile switching with dirty Dockerfile edits', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderRuntimesPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Duplicate starter' }));
    expect(await screen.findByDisplayValue('Starter copy')).toBeTruthy();
    fireEvent.change(await screen.findByLabelText('Dockerfile editor'), {
      target: { value: 'FROM unsaved\n' },
    });
    fireEvent.click(screen.getByRole('button', { name: /starter bundled starter/i }));

    expect(window.confirm).toHaveBeenCalledWith('Discard unsaved Dockerfile changes?');
    expect(screen.getByDisplayValue('Starter copy')).toBeTruthy();
  });
});

function renderRuntimesPage() {
  const router = createMemoryRouter([
    {
      path: '/',
      element: <RuntimesPage />,
    },
  ]);

  return renderWithQuery(<RouterProvider router={router} />);
}
