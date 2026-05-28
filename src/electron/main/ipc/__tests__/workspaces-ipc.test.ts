import { describe, expect, it } from 'vitest';
import type {
  GitRepositoryInfo,
  GitRepositoryInspector,
  Workspace,
  WorkspaceInput,
  WorkspaceRepository,
} from '@/core/workspaces/domain';
import { createWorkspacesIpcHandlers } from '../register-workspaces-ipc';

class FakeGitRepositoryInspector implements GitRepositoryInspector {
  async inspect(path: string): Promise<GitRepositoryInfo> {
    return {
      path,
      name: 'repo',
      currentBranch: 'main',
    };
  }
}

class FakeWorkspaceRepository implements WorkspaceRepository {
  workspaces: Workspace[] = [];

  async listWorkspaces(): Promise<Workspace[]> {
    return this.workspaces;
  }

  async getWorkspace(id: string): Promise<Workspace | null> {
    return this.workspaces.find((workspace) => workspace.id === id) ?? null;
  }

  async upsertWorkspace(
    input: WorkspaceInput,
    timestamps: { createdAt: number; updatedAt: number },
  ): Promise<Workspace> {
    const workspace: Workspace = {
      id: 'workspace-1',
      ...input,
      ...timestamps,
    };
    this.workspaces = [workspace];
    return workspace;
  }
}

describe('workspaces IPC handlers', () => {
  it('lists workspaces', async () => {
    const workspaceRepository = new FakeWorkspaceRepository();
    workspaceRepository.workspaces = [
      {
        id: 'workspace-1',
        path: '/repo',
        name: 'repo',
        currentBranch: 'main',
        createdAt: 1,
        updatedAt: 1,
      },
    ];
    const handlers = createWorkspacesIpcHandlers({
      gitRepositoryInspector: new FakeGitRepositoryInspector(),
      workspaceRepository,
      pickDirectory: async () => null,
      now: () => 123,
    });

    await expect(handlers.list()).resolves.toEqual(workspaceRepository.workspaces);
  });

  it('picks and registers a git-backed workspace', async () => {
    const handlers = createWorkspacesIpcHandlers({
      gitRepositoryInspector: new FakeGitRepositoryInspector(),
      workspaceRepository: new FakeWorkspaceRepository(),
      pickDirectory: async () => '/repo',
      now: () => 123,
    });

    await expect(handlers.pick()).resolves.toEqual({
      id: 'workspace-1',
      path: '/repo',
      name: 'repo',
      currentBranch: 'main',
      createdAt: 123,
      updatedAt: 123,
    });
  });

  it('returns null when directory picking is cancelled', async () => {
    const handlers = createWorkspacesIpcHandlers({
      gitRepositoryInspector: new FakeGitRepositoryInspector(),
      workspaceRepository: new FakeWorkspaceRepository(),
      pickDirectory: async () => null,
      now: () => 123,
    });

    await expect(handlers.pick()).resolves.toBeNull();
  });
});
