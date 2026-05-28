// @vitest-environment jsdom

import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import type { DesktopApi } from '@/contracts/ipc/shared/desktop-api';
import { renderWithQuery } from '../../../shared/testing/render-with-query';
import { NewAgentRunPage } from '../ui/NewAgentRunPage';
import { AgentRunsPage } from '../ui/AgentRunsPage';
import { AgentRunDetailPage } from '../ui/AgentRunDetailPage';

const starterProfile = {
  id: 'starter',
  name: 'Starter',
  sourceKind: 'bundled-starter' as const,
  profilePath: null,
  imageName: 'agentic:starter',
  claudeAuthMountEnabled: false,
  codexAuthMountEnabled: false,
  createdAt: 1,
  updatedAt: 1,
};

describe('AgentRunsPage', () => {
  beforeEach(() => {
    window.desktop = {
      appInfo: {
        get: vi.fn(),
      },
      workspaces: {
        pick: vi.fn(),
        list: vi.fn(),
      },
      agentRuns: {
        start: vi.fn(),
        list: vi.fn(async () => [
          {
            id: 'run-1',
            workspaceId: 'workspace-1',
            workspacePath: '/repo',
            workspaceName: 'repo',
            runtimeProfileId: 'starter',
            runtimeProfileName: 'Starter',
            runtimeImageName: 'agentic:starter',
            provider: 'codex' as const,
            model: 'gpt-5.4',
            prompt: 'Implement the thing',
            maxIterations: 1,
            status: 'succeeded' as const,
            branchName: 'agentic/run-1-implement',
            logFilePath: '/tmp/run.log',
            createdAt: 100,
            startedAt: 110,
            finishedAt: 200,
            errorMessage: null,
          },
        ]),
        get: vi.fn(),
        getCommitDetails: vi.fn(),
        getCommitFileDiff: vi.fn(),
        cancel: vi.fn(),
        onEvent: vi.fn(() => () => undefined),
      },
      agentRuntime: {
        listProfiles: vi.fn(async () => [starterProfile]),
        getProfile: vi.fn(async () => starterProfile),
        updateProfile: vi.fn(),
        duplicateStarterProfile: vi.fn(),
        getProfileDockerfile: vi.fn(),
        updateProfileDockerfile: vi.fn(),
        resetProfileDockerfile: vi.fn(),
        openProfileFolder: vi.fn(),
        getImageStatus: vi.fn(),
        buildImage: vi.fn(),
        onBuildEvent: vi.fn(() => () => undefined),
      },
      notes: {
        list: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
    } satisfies DesktopApi;
  });

  it('renders persisted agent runs', async () => {
    renderWithQuery(
      <MemoryRouter>
        <AgentRunsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('repo')).toBeTruthy();
    expect(screen.getByText('Implement the thing')).toBeTruthy();
    expect(screen.getByText('succeeded')).toBeTruthy();
  });

  it('blocks new runs until the sandbox image is available', async () => {
    window.desktop.workspaces.list = vi.fn(async () => [
      {
        id: 'workspace-1',
        path: '/repo',
        name: 'repo',
        currentBranch: 'main',
        createdAt: 100,
        updatedAt: 100,
      },
    ]);
    window.desktop.agentRuntime.getImageStatus = vi.fn()
      .mockResolvedValueOnce({
        imageName: 'agentic:starter',
        available: false,
        checkedAt: 100,
        errorMessage: 'Image not found locally.',
      })
      .mockResolvedValueOnce({
        imageName: 'agentic:starter',
        available: true,
        checkedAt: 200,
      });
    window.desktop.agentRuntime.buildImage = vi.fn(async () => ({
      imageName: 'agentic:starter',
      succeeded: true,
    }));

    renderWithQuery(
      <MemoryRouter>
        <NewAgentRunPage />
      </MemoryRouter>,
    );

    fireEvent.change(await screen.findByLabelText('Prompt'), {
      target: { value: 'Document the repo' },
    });
    fireEvent.change(screen.getByLabelText('Model'), {
      target: { value: 'gpt-5.4' },
    });

    expect(screen.getByRole('button', { name: /start run/i })).toBeDisabled();
    expect(await screen.findByText('Image not found locally.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /build image/i }));

    await waitFor(() => {
      expect(window.desktop.agentRuntime.buildImage).toHaveBeenCalledTimes(1);
      expect(window.desktop.agentRuntime.getImageStatus).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('button', { name: /start run/i })).not.toBeDisabled();
    });
  });

  it('renders commit details and a polished diff on run detail', async () => {
    window.desktop.agentRuns.get = vi.fn(async () => ({
      run: {
        id: 'run-1',
        workspaceId: 'workspace-1',
        workspacePath: '/repo',
        workspaceName: 'repo',
        runtimeProfileId: 'starter',
        runtimeProfileName: 'Starter',
        runtimeImageName: 'agentic:starter',
        provider: 'codex' as const,
        model: 'gpt-5.4',
        prompt: 'Implement the thing',
        maxIterations: 1,
        status: 'succeeded' as const,
        branchName: 'agentic/run-1-implement',
        logFilePath: '/tmp/run.log',
        createdAt: 100,
        startedAt: 110,
        finishedAt: 200,
        errorMessage: null,
      },
      events: [],
      commits: [
        {
          runId: 'run-1',
          sha: 'abcdef123',
          shortSha: 'abcdef1',
          subject: 'docs: add smoke test',
          createdAt: 200,
          filesChanged: 1,
          additions: 1,
          deletions: 0,
          unavailable: false,
        },
      ],
    }));
    window.desktop.agentRuns.getCommitDetails = vi.fn(async () => ({
      runId: 'run-1',
      sha: 'abcdef123',
      shortSha: 'abcdef1',
      subject: 'docs: add smoke test',
      authorName: 'Dev',
      authorEmail: 'dev@example.com',
      committedAt: 200,
      filesChanged: 1,
      additions: 1,
      deletions: 0,
      files: [
        {
          oldPath: 'docs/smoke.md',
          newPath: 'docs/smoke.md',
          status: 'modified' as const,
          additions: 1,
          deletions: 0,
          isLarge: false,
          hunks: [
            {
              header: '@@ -1,1 +1,2 @@',
              lines: [
                {
                  type: 'context' as const,
                  content: 'Existing',
                  oldLineNumber: 1,
                  newLineNumber: 1,
                },
                {
                  type: 'addition' as const,
                  content: 'Added',
                  oldLineNumber: null,
                  newLineNumber: 2,
                },
              ],
            },
          ],
        },
      ],
    }));

    renderWithQuery(
      <MemoryRouter initialEntries={['/runs/run-1']}>
        <Routes>
          <Route path="/runs/:runId" element={<AgentRunDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('docs: add smoke test')).toBeTruthy();
    expect(await screen.findByText('docs/smoke.md')).toBeTruthy();
    expect(screen.getByText('@@ -1,1 +1,2 @@')).toBeTruthy();
    expect(screen.getByText('Added')).toBeTruthy();
  });
});
