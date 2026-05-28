import type { Workspace, WorkspaceInput } from '../entities/workspace';

export interface WorkspaceRepository {
  listWorkspaces(): Promise<Workspace[]>;
  getWorkspace(id: string): Promise<Workspace | null>;
  upsertWorkspace(input: WorkspaceInput, timestamps: { createdAt: number; updatedAt: number }): Promise<Workspace>;
}
