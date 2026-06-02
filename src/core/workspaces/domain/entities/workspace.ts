export type Workspace = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
};

export type WorkspaceInput = {
  name: string;
};

export type WorkspaceSummary = Workspace & {
  folderCount: number;
};

export type WorkspaceFolder = {
  id: string;
  workspaceId: string;
  label: string;
  path: string;
  currentBranch: string | null;
  createdAt: number;
  updatedAt: number;
};

export type WorkspaceFolderInput = {
  id: string;
  workspaceId: string;
  label: string;
  path: string;
  currentBranch: string | null;
};

export type WorkspaceDetail = Workspace & {
  folders: WorkspaceFolder[];
};
