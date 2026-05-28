export type Workspace = {
  id: string;
  path: string;
  name: string;
  currentBranch: string | null;
  createdAt: number;
  updatedAt: number;
};

export type WorkspaceInput = {
  path: string;
  name: string;
  currentBranch: string | null;
};
