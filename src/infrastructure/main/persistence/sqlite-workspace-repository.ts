import { createHash } from 'node:crypto';
import type { Workspace, WorkspaceInput, WorkspaceRepository } from '@/core/workspaces/domain';
import { getMainDatabase } from './db/client';

export class SQLiteWorkspaceRepository implements WorkspaceRepository {
  async listWorkspaces(): Promise<Workspace[]> {
    const rows = getMainDatabase()
      .prepare(
        `
          SELECT id, path, name, current_branch AS currentBranch, created_at AS createdAt, updated_at AS updatedAt
          FROM workspaces
          ORDER BY updated_at DESC, name ASC
        `,
      )
      .all() as WorkspaceRow[];

    return rows.map(toWorkspace);
  }

  async getWorkspace(id: string): Promise<Workspace | null> {
    const row = getMainDatabase()
      .prepare(
        `
          SELECT id, path, name, current_branch AS currentBranch, created_at AS createdAt, updated_at AS updatedAt
          FROM workspaces
          WHERE id = ?
        `,
      )
      .get(id) as WorkspaceRow | undefined;

    return row ? toWorkspace(row) : null;
  }

  async upsertWorkspace(
    input: WorkspaceInput,
    timestamps: { createdAt: number; updatedAt: number },
  ): Promise<Workspace> {
    const db = getMainDatabase();
    const id = toWorkspaceId(input.path);

    db.prepare(
      `
        INSERT INTO workspaces (id, path, name, current_branch, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(path) DO UPDATE SET
          name = excluded.name,
          current_branch = excluded.current_branch,
          updated_at = excluded.updated_at
      `,
    ).run(
      id,
      input.path,
      input.name,
      input.currentBranch,
      timestamps.createdAt,
      timestamps.updatedAt,
    );

    const workspace = await this.getWorkspace(id);

    if (!workspace) {
      throw new Error('Failed to save workspace.');
    }

    return workspace;
  }
}

type WorkspaceRow = {
  id: string;
  path: string;
  name: string;
  currentBranch: string | null;
  createdAt: number;
  updatedAt: number;
};

function toWorkspace(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    path: row.path,
    name: row.name,
    currentBranch: row.currentBranch,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toWorkspaceId(workspacePath: string): string {
  return createHash('sha256').update(workspacePath).digest('hex').slice(0, 16);
}
