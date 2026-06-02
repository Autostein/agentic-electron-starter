import type {
  Workspace,
  WorkspaceDetail,
  WorkspaceFolder,
  WorkspaceFolderInput,
  WorkspaceInput,
  WorkspaceSummary,
} from '../entities/workspace';

export interface WorkspaceRepository {
  listWorkspaces(): Promise<WorkspaceSummary[]>;
  getWorkspace(id: string): Promise<Workspace | null>;
  getWorkspaceDetail(id: string): Promise<WorkspaceDetail | null>;
  createWorkspace(
    input: WorkspaceInput & { id: string },
    timestamps: { createdAt: number; updatedAt: number },
  ): Promise<Workspace>;
  updateWorkspace(id: string, input: WorkspaceInput, updatedAt: number): Promise<Workspace>;
  listFolders(workspaceId: string): Promise<WorkspaceFolder[]>;
  getFolder(id: string): Promise<WorkspaceFolder | null>;
  addFolder(
    input: WorkspaceFolderInput,
    timestamps: { createdAt: number; updatedAt: number },
  ): Promise<WorkspaceFolder>;
  updateFolder(
    id: string,
    input: Pick<WorkspaceFolderInput, 'label'>,
    updatedAt: number,
  ): Promise<WorkspaceFolder>;
  removeFolder(id: string): Promise<void>;
}
