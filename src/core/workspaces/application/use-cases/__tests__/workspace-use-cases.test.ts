import { describe, expect, it } from 'vitest';
import type { AgentRunRepository } from '@/core/agent-runs/domain';
import type {
  GitRepositoryInfo,
  GitRepositoryInspector,
  Workspace,
  WorkspaceDetail,
  WorkspaceFolder,
  WorkspaceFolderInput,
  WorkspaceInput,
  WorkspaceRepository,
  WorkspaceSummary,
} from '../../../domain';
import { addWorkspaceFolder } from '../add-workspace-folder';
import { createWorkspace } from '../create-workspace';
import { removeWorkspaceFolder } from '../remove-workspace-folder';
import { updateWorkspaceFolder } from '../update-workspace-folder';
import { updateWorkspace } from '../update-workspace';

class FakeWorkspaceRepository implements WorkspaceRepository {
  workspaces: Workspace[] = [];
  folders: WorkspaceFolder[] = [];

  async listWorkspaces(): Promise<WorkspaceSummary[]> {
    return this.workspaces.map((workspace) => ({
      ...workspace,
      folderCount: this.folders.filter((folder) => folder.workspaceId === workspace.id).length,
    }));
  }

  async getWorkspace(id: string): Promise<Workspace | null> {
    return this.workspaces.find((workspace) => workspace.id === id) ?? null;
  }

  async getWorkspaceDetail(id: string): Promise<WorkspaceDetail | null> {
    const workspace = await this.getWorkspace(id);

    return workspace ? { ...workspace, folders: await this.listFolders(id) } : null;
  }

  async createWorkspace(
    input: WorkspaceInput & { id: string },
    timestamps: { createdAt: number; updatedAt: number },
  ): Promise<Workspace> {
    const workspace = { ...input, ...timestamps };
    this.workspaces.push(workspace);
    return workspace;
  }

  async updateWorkspace(id: string, input: WorkspaceInput, updatedAt: number): Promise<Workspace> {
    const workspace = await this.getWorkspace(id);

    if (!workspace) {
      throw new Error('Workspace not found.');
    }

    Object.assign(workspace, input, { updatedAt });
    return workspace;
  }

  async listFolders(workspaceId: string): Promise<WorkspaceFolder[]> {
    return this.folders.filter((folder) => folder.workspaceId === workspaceId);
  }

  async getFolder(id: string): Promise<WorkspaceFolder | null> {
    return this.folders.find((folder) => folder.id === id) ?? null;
  }

  async addFolder(
    input: WorkspaceFolderInput,
    timestamps: { createdAt: number; updatedAt: number },
  ): Promise<WorkspaceFolder> {
    const folder = { ...input, ...timestamps };
    this.folders.push(folder);
    return folder;
  }

  async updateFolder(
    id: string,
    input: Pick<WorkspaceFolderInput, 'label'>,
    updatedAt: number,
  ): Promise<WorkspaceFolder> {
    const folder = await this.getFolder(id);

    if (!folder) {
      throw new Error('Workspace folder not found.');
    }

    Object.assign(folder, input, { updatedAt });
    return folder;
  }

  async removeFolder(id: string): Promise<void> {
    this.folders = this.folders.filter((folder) => folder.id !== id);
  }
}

class FakeGitRepositoryInspector implements GitRepositoryInspector {
  info: GitRepositoryInfo = {
    path: '/repo',
    name: 'repo',
    currentBranch: 'main',
  };

  async inspect(): Promise<GitRepositoryInfo> {
    return this.info;
  }
}

class FakeRunRepository implements Pick<AgentRunRepository, 'hasActiveRunForTargetFolder'> {
  activeTargetFolderIds = new Set<string>();

  async hasActiveRunForTargetFolder(targetFolderId: string): Promise<boolean> {
    return this.activeTargetFolderIds.has(targetFolderId);
  }
}

describe('workspace use-cases', () => {
  it('creates and renames workspace groups', async () => {
    const workspaceRepository = new FakeWorkspaceRepository();
    const workspace = await createWorkspace(
      { name: ' Website ' },
      {
        createId: () => 'workspace-1',
        workspaceRepository,
        now: () => 100,
      },
    );

    expect(workspace).toEqual({
      id: 'workspace-1',
      name: 'Website',
      createdAt: 100,
      updatedAt: 100,
    });
    await expect(updateWorkspace(
      { id: workspace.id, name: ' Product ' },
      { workspaceRepository, now: () => 200 },
    )).resolves.toMatchObject({
      id: workspace.id,
      name: 'Product',
      updatedAt: 200,
    });
  });

  it('adds git folders with normalized roots and unique labels', async () => {
    const workspaceRepository = new FakeWorkspaceRepository();
    const gitRepositoryInspector = new FakeGitRepositoryInspector();
    await workspaceRepository.createWorkspace(
      { id: 'workspace-1', name: 'Website' },
      { createdAt: 100, updatedAt: 100 },
    );
    workspaceRepository.folders.push({
      id: 'folder-existing',
      workspaceId: 'workspace-1',
      label: 'Repo',
      path: '/other',
      currentBranch: 'main',
      createdAt: 100,
      updatedAt: 100,
    });

    const folder = await addWorkspaceFolder(
      { workspaceId: 'workspace-1', path: '/repo/packages/app' },
      {
        createId: () => 'folder-1',
        gitRepositoryInspector,
        workspaceRepository,
        now: () => 200,
      },
    );

    expect(folder).toMatchObject({
      id: 'folder-1',
      workspaceId: 'workspace-1',
      label: 'repo 2',
      path: '/repo',
      currentBranch: 'main',
    });
  });

  it('rejects duplicate folder paths and labels inside a workspace', async () => {
    const workspaceRepository = new FakeWorkspaceRepository();
    const gitRepositoryInspector = new FakeGitRepositoryInspector();
    await workspaceRepository.createWorkspace(
      { id: 'workspace-1', name: 'Website' },
      { createdAt: 100, updatedAt: 100 },
    );
    workspaceRepository.folders.push(
      {
        id: 'folder-1',
        workspaceId: 'workspace-1',
        label: 'Application',
        path: '/repo',
        currentBranch: 'main',
        createdAt: 100,
        updatedAt: 100,
      },
      {
        id: 'folder-2',
        workspaceId: 'workspace-1',
        label: 'Docs',
        path: '/docs',
        currentBranch: 'main',
        createdAt: 100,
        updatedAt: 100,
      },
    );

    await expect(addWorkspaceFolder(
      { workspaceId: 'workspace-1', path: '/repo' },
      {
        createId: () => 'folder-3',
        gitRepositoryInspector,
        workspaceRepository,
        now: () => 200,
      },
    )).rejects.toThrow('Folder is already attached to this workspace.');
    await expect(updateWorkspaceFolder(
      { id: 'folder-2', label: ' application ' },
      { workspaceRepository, now: () => 200 },
    )).rejects.toThrow('Folder label is already used in this workspace.');
  });

  it('blocks removing folders that have active runs', async () => {
    const workspaceRepository = new FakeWorkspaceRepository();
    const agentRunRepository = new FakeRunRepository();
    workspaceRepository.folders.push({
      id: 'folder-1',
      workspaceId: 'workspace-1',
      label: 'Application',
      path: '/repo',
      currentBranch: 'main',
      createdAt: 100,
      updatedAt: 100,
    });
    agentRunRepository.activeTargetFolderIds.add('folder-1');

    await expect(removeWorkspaceFolder('folder-1', {
      agentRunRepository,
      workspaceRepository,
    })).rejects.toThrow('Folder has an active agent run.');

    agentRunRepository.activeTargetFolderIds.clear();
    await expect(removeWorkspaceFolder('folder-1', {
      agentRunRepository,
      workspaceRepository,
    })).resolves.toBeUndefined();
    await expect(workspaceRepository.listFolders('workspace-1')).resolves.toEqual([]);
  });
});
