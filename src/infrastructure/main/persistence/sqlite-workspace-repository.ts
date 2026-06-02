import type {
  Workspace,
  WorkspaceDetail,
  WorkspaceFolder,
  WorkspaceFolderInput,
  WorkspaceInput,
  WorkspaceRepository,
  WorkspaceSummary,
} from '@/core/workspaces/domain';
import { AppError } from '@/shared/app-errors';
import { getMainDatabase } from './db/client';

export class SQLiteWorkspaceRepository implements WorkspaceRepository {
  async listWorkspaces(): Promise<WorkspaceSummary[]> {
    const rows = getMainDatabase()
      .prepare(
        `
          SELECT
            workspaces.id,
            workspaces.name,
            workspaces.created_at AS createdAt,
            workspaces.updated_at AS updatedAt,
            COUNT(workspace_folders.id) AS folderCount
          FROM workspaces
          LEFT JOIN workspace_folders ON workspace_folders.workspace_id = workspaces.id
          GROUP BY workspaces.id
          ORDER BY workspaces.updated_at DESC, workspaces.name ASC
        `,
      )
      .all() as WorkspaceSummaryRow[];

    return rows.map(toWorkspaceSummary);
  }

  async getWorkspace(id: string): Promise<Workspace | null> {
    const row = getMainDatabase()
      .prepare(
        `
          SELECT id, name, created_at AS createdAt, updated_at AS updatedAt
          FROM workspaces
          WHERE id = ?
        `,
      )
      .get(id) as WorkspaceRow | undefined;

    return row ? toWorkspace(row) : null;
  }

  async getWorkspaceDetail(id: string): Promise<WorkspaceDetail | null> {
    const workspace = await this.getWorkspace(id);

    if (!workspace) {
      return null;
    }

    return {
      ...workspace,
      folders: await this.listFolders(id),
    };
  }

  async createWorkspace(
    input: WorkspaceInput & { id: string },
    timestamps: { createdAt: number; updatedAt: number },
  ): Promise<Workspace> {
    getMainDatabase()
      .prepare(
        `
          INSERT INTO workspaces (id, name, created_at, updated_at)
          VALUES (?, ?, ?, ?)
        `,
      )
      .run(input.id, input.name, timestamps.createdAt, timestamps.updatedAt);

    const workspace = await this.getWorkspace(input.id);

    if (!workspace) {
      throw new Error('Failed to create workspace.');
    }

    return workspace;
  }

  async updateWorkspace(
    id: string,
    input: WorkspaceInput,
    updatedAt: number,
  ): Promise<Workspace> {
    getMainDatabase()
      .prepare(
        `
          UPDATE workspaces
          SET name = ?, updated_at = ?
          WHERE id = ?
        `,
      )
      .run(input.name, updatedAt, id);

    const workspace = await this.getWorkspace(id);

    if (!workspace) {
      throw new AppError('NOT_FOUND', 'Workspace not found.');
    }

    return workspace;
  }

  async listFolders(workspaceId: string): Promise<WorkspaceFolder[]> {
    const rows = getMainDatabase()
      .prepare(
        `
          SELECT
            id,
            workspace_id AS workspaceId,
            label,
            path,
            current_branch AS currentBranch,
            created_at AS createdAt,
            updated_at AS updatedAt
          FROM workspace_folders
          WHERE workspace_id = ?
          ORDER BY label ASC, created_at ASC
        `,
      )
      .all(workspaceId) as WorkspaceFolderRow[];

    return rows.map(toWorkspaceFolder);
  }

  async getFolder(id: string): Promise<WorkspaceFolder | null> {
    const row = getMainDatabase()
      .prepare(
        `
          SELECT
            id,
            workspace_id AS workspaceId,
            label,
            path,
            current_branch AS currentBranch,
            created_at AS createdAt,
            updated_at AS updatedAt
          FROM workspace_folders
          WHERE id = ?
        `,
      )
      .get(id) as WorkspaceFolderRow | undefined;

    return row ? toWorkspaceFolder(row) : null;
  }

  async addFolder(
    input: WorkspaceFolderInput,
    timestamps: { createdAt: number; updatedAt: number },
  ): Promise<WorkspaceFolder> {
    try {
      getMainDatabase()
        .prepare(
          `
            INSERT INTO workspace_folders (
              id,
              workspace_id,
              label,
              path,
              current_branch,
              created_at,
              updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
        )
        .run(
          input.id,
          input.workspaceId,
          input.label,
          input.path,
          input.currentBranch,
          timestamps.createdAt,
          timestamps.updatedAt,
        );
    } catch (error) {
      throw toWorkspaceConstraintError(error);
    }

    const folder = await this.getFolder(input.id);

    if (!folder) {
      throw new Error('Failed to add workspace folder.');
    }

    return folder;
  }

  async updateFolder(
    id: string,
    input: Pick<WorkspaceFolderInput, 'label'>,
    updatedAt: number,
  ): Promise<WorkspaceFolder> {
    try {
      getMainDatabase()
        .prepare(
          `
            UPDATE workspace_folders
            SET label = ?, updated_at = ?
            WHERE id = ?
          `,
        )
        .run(input.label, updatedAt, id);
    } catch (error) {
      throw toWorkspaceConstraintError(error);
    }

    const folder = await this.getFolder(id);

    if (!folder) {
      throw new AppError('NOT_FOUND', 'Workspace folder not found.');
    }

    return folder;
  }

  async removeFolder(id: string): Promise<void> {
    getMainDatabase()
      .prepare('DELETE FROM workspace_folders WHERE id = ?')
      .run(id);
  }
}

type WorkspaceRow = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
};

type WorkspaceSummaryRow = WorkspaceRow & {
  folderCount: number;
};

type WorkspaceFolderRow = {
  id: string;
  workspaceId: string;
  label: string;
  path: string;
  currentBranch: string | null;
  createdAt: number;
  updatedAt: number;
};

function toWorkspace(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toWorkspaceSummary(row: WorkspaceSummaryRow): WorkspaceSummary {
  return {
    ...toWorkspace(row),
    folderCount: row.folderCount,
  };
}

function toWorkspaceFolder(row: WorkspaceFolderRow): WorkspaceFolder {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    label: row.label,
    path: row.path,
    currentBranch: row.currentBranch,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toWorkspaceConstraintError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);

  if (
    message.includes('workspace_folders_workspace_path_unique')
      || message.includes('workspace_folders.workspace_id, workspace_folders.path')
  ) {
    return new AppError('CONFLICT', 'Folder path already exists in this workspace.');
  }

  if (
    message.includes('workspace_folders_workspace_label_unique')
      || message.includes('workspace_folders.workspace_id, workspace_folders.label')
  ) {
    return new AppError('CONFLICT', 'Folder label already exists in this workspace.');
  }

  return error instanceof Error ? error : new Error(message);
}
