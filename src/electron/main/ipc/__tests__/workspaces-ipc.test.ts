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
    return workspace
      ? { ...workspace, folders: await this.listFolders(id) }
      : null;
  }

  async createWorkspace(
    input: WorkspaceInput & { id: string },
    timestamps: { createdAt: number; updatedAt: number },
  ): Promise<Workspace> {
    const workspace = { ...input, ...timestamps };
    this.workspaces = [...this.workspaces, workspace];
    return workspace;
  }

  async updateWorkspace(
    id: string,
    input: WorkspaceInput,
    updatedAt: number,
  ): Promise<Workspace> {
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
    this.folders = [...this.folders, folder];
    return folder;
  }

  async updateFolder(
    id: string,
    input: Pick<WorkspaceFolderInput, 'label'>,
    updatedAt: number,
  ): Promise<WorkspaceFolder> {
    const folder = await this.getFolder(id);
    if (!folder) {
      throw new Error('Folder not found.');
    }
    Object.assign(folder, input, { updatedAt });
    return folder;
  }

  async removeFolder(id: string): Promise<void> {
    this.folders = this.folders.filter((folder) => folder.id !== id);
  }
}

class FakeRunRepository implements Pick<AgentRunRepository, 'hasActiveRunForTargetFolder'> {
  activeTargetFolderIds = new Set<string>();

  async hasActiveRunForTargetFolder(targetFolderId: string): Promise<boolean> {
    return this.activeTargetFolderIds.has(targetFolderId);
  }
}

function createHandlers(options: {
  pickDirectory?: () => Promise<string | null>;
  runRepository?: FakeRunRepository;
  workspaceRepository?: FakeWorkspaceRepository;
} = {}) {
  const workspaceRepository = options.workspaceRepository ?? new FakeWorkspaceRepository();
  const runRepository = options.runRepository ?? new FakeRunRepository();
  return createWorkspacesIpcHandlers({
    agentRunRepository: runRepository as unknown as AgentRunRepository,
    gitRepositoryInspector: new FakeGitRepositoryInspector(),
    workspaceRepository,
    pickDirectory: options.pickDirectory ?? (async () => null),
    now: () => 123,
  });
}

describe('workspaces IPC handlers', () => {
  it('creates, lists, and gets workspace details', async () => {
    const workspaceRepository = new FakeWorkspaceRepository();
    const handlers = createHandlers({ workspaceRepository });
    const workspace = await handlers.create(null, { name: 'Website' });

    expect(workspace).toMatchObject({ name: 'Website', folders: [] });
    await expect(handlers.list()).resolves.toEqual([
      {
        id: workspace.id,
        name: 'Website',
        folderCount: 0,
        createdAt: 123,
        updatedAt: 123,
      },
    ]);
    await expect(handlers.get(null, { id: workspace.id })).resolves.toMatchObject({
      id: workspace.id,
      name: 'Website',
      folders: [],
    });
  });

  it('picks and adds a git-backed workspace folder', async () => {
    const workspaceRepository = new FakeWorkspaceRepository();
    const handlers = createHandlers({
      workspaceRepository,
      pickDirectory: async () => '/repo',
    });
    const workspace = await handlers.create(null, { name: 'Website' });

    await expect(handlers.pickFolder(null, { workspaceId: workspace.id })).resolves.toMatchObject({
      workspaceId: workspace.id,
      label: 'repo',
      path: '/repo',
      currentBranch: 'main',
      createdAt: 123,
      updatedAt: 123,
    });
  });

  it('returns null when folder picking is cancelled', async () => {
    const workspaceRepository = new FakeWorkspaceRepository();
    const handlers = createHandlers({ workspaceRepository });
    const workspace = await handlers.create(null, { name: 'Website' });

    await expect(handlers.pickFolder(null, { workspaceId: workspace.id })).resolves.toBeNull();
  });

  it('updates and removes folders, blocking active runs', async () => {
    const runRepository = new FakeRunRepository();
    const workspaceRepository = new FakeWorkspaceRepository();
    const handlers = createHandlers({
      runRepository,
      workspaceRepository,
      pickDirectory: async () => '/repo',
    });
    const workspace = await handlers.create(null, { name: 'Website' });
    const folder = await handlers.pickFolder(null, { workspaceId: workspace.id });

    if (!folder) {
      throw new Error('Expected folder.');
    }

    await expect(handlers.updateFolder(null, {
      id: folder.id,
      label: 'Application',
    })).resolves.toMatchObject({ label: 'Application' });

    runRepository.activeTargetFolderIds.add(folder.id);
    await expect(handlers.removeFolder(null, { id: folder.id })).rejects.toMatchObject({
      message: 'Folder has an active agent run.',
    });
    runRepository.activeTargetFolderIds.clear();
    await expect(handlers.removeFolder(null, { id: folder.id })).resolves.toBeUndefined();
  });
});
