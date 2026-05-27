import { createHash } from 'node:crypto';
import type { Project, ProjectInput, ProjectRepository } from '@/core/projects/domain';
import { getMainDatabase } from './db/client';

export class SQLiteProjectRepository implements ProjectRepository {
  async listProjects(): Promise<Project[]> {
    const rows = getMainDatabase()
      .prepare(
        `
          SELECT id, path, name, current_branch AS currentBranch, created_at AS createdAt, updated_at AS updatedAt
          FROM projects
          ORDER BY updated_at DESC, name ASC
        `,
      )
      .all() as ProjectRow[];

    return rows.map(toProject);
  }

  async getProject(id: string): Promise<Project | null> {
    const row = getMainDatabase()
      .prepare(
        `
          SELECT id, path, name, current_branch AS currentBranch, created_at AS createdAt, updated_at AS updatedAt
          FROM projects
          WHERE id = ?
        `,
      )
      .get(id) as ProjectRow | undefined;

    return row ? toProject(row) : null;
  }

  async upsertProject(
    input: ProjectInput,
    timestamps: { createdAt: number; updatedAt: number },
  ): Promise<Project> {
    const db = getMainDatabase();
    const id = toProjectId(input.path);

    db.prepare(
      `
        INSERT INTO projects (id, path, name, current_branch, created_at, updated_at)
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

    const project = await this.getProject(id);

    if (!project) {
      throw new Error('Failed to save project.');
    }

    return project;
  }
}

type ProjectRow = {
  id: string;
  path: string;
  name: string;
  currentBranch: string | null;
  createdAt: number;
  updatedAt: number;
};

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    path: row.path,
    name: row.name,
    currentBranch: row.currentBranch,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toProjectId(projectPath: string): string {
  return createHash('sha256').update(projectPath).digest('hex').slice(0, 16);
}
