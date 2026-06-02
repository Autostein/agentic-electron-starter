// @vitest-environment jsdom

import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import type { DesktopApi } from '@/contracts/ipc/shared/desktop-api';
import type { WorkspaceDetailResult } from '@/contracts/ipc/workspaces.contract';
import { renderWithQuery } from '../../../shared/testing/render-with-query';
import { WorkspaceDetailPage } from '../ui/WorkspaceDetailPage';
import { WorkspacesPage } from '../ui/WorkspacesPage';

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

describe('WorkspacesPage', () => {
  let workspaceDetail: WorkspaceDetailResult;

  beforeEach(() => {
    workspaceDetail = {
      id: 'workspace-1',
      name: 'Website',
      createdAt: 100,
      updatedAt: 100,
      folders: [],
    };

    window.desktop = {
      appInfo: {
        get: vi.fn(),
      },
      workspaces: {
        create: vi.fn(async (input) => ({
          ...workspaceDetail,
          id: 'workspace-2',
          name: input.name,
          folders: [],
        })),
        update: vi.fn(async (input) => {
          workspaceDetail = { ...workspaceDetail, name: input.name, updatedAt: 200 };
          return workspaceDetail;
        }),
        list: vi.fn(async () => [
          {
            id: workspaceDetail.id,
            name: workspaceDetail.name,
            folderCount: workspaceDetail.folders.length,
            createdAt: workspaceDetail.createdAt,
            updatedAt: workspaceDetail.updatedAt,
          },
        ]),
        get: vi.fn(async () => workspaceDetail),
        pickFolder: vi.fn(async () => {
          const folder = {
            id: 'folder-1',
            workspaceId: workspaceDetail.id,
            label: 'Application',
            path: '/repo',
            currentBranch: 'main',
            createdAt: 200,
            updatedAt: 200,
          };
          workspaceDetail = { ...workspaceDetail, folders: [folder] };
          return folder;
        }),
        updateFolder: vi.fn(async (input) => {
          const folder = workspaceDetail.folders.find((item) => item.id === input.id);

          if (!folder) {
            throw new Error('Workspace folder not found.');
          }

          const updatedFolder = { ...folder, label: input.label, updatedAt: 300 };
          workspaceDetail = { ...workspaceDetail, folders: [updatedFolder] };
          return updatedFolder;
        }),
        removeFolder: vi.fn(async (input) => {
          workspaceDetail = {
            ...workspaceDetail,
            folders: workspaceDetail.folders.filter((folder) => folder.id !== input.id),
          };
        }),
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

  it('creates workspace groups by name', async () => {
    renderWithQuery(
      <MemoryRouter>
        <WorkspacesPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText('Workspace name'), {
      target: { value: 'Mobile' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(window.desktop.workspaces.create).toHaveBeenCalledWith({ name: 'Mobile' });
    });
  });

  it('manages workspace folders and links new runs to a target folder', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderWithQuery(
      <MemoryRouter initialEntries={['/workspaces/workspace-1']}>
        <Routes>
          <Route path="/workspaces/:workspaceId" element={<WorkspaceDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('No folders attached yet.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /add folder/i }));
    expect(await screen.findByDisplayValue('Application')).toBeTruthy();
    expect(screen.getByRole('link', { name: /new run/i })).toHaveAttribute(
      'href',
      '/runs/new?workspaceId=workspace-1&targetFolderId=folder-1',
    );

    fireEvent.change(screen.getByLabelText('Application label'), {
      target: { value: 'Web' },
    });
    fireEvent.click(screen.getByLabelText('Save Application label'));

    await waitFor(() => {
      expect(window.desktop.workspaces.updateFolder).toHaveBeenCalledWith({
        id: 'folder-1',
        label: 'Web',
      });
    });
    expect(await screen.findByDisplayValue('Web')).toBeTruthy();

    fireEvent.click(await screen.findByLabelText('Remove Web'));

    await waitFor(() => {
      expect(window.desktop.workspaces.removeFolder).toHaveBeenCalledWith({ id: 'folder-1' });
    });
    expect(await screen.findByText('No folders attached yet.')).toBeTruthy();
  });
});
