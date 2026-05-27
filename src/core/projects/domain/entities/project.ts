export type Project = {
  id: string;
  path: string;
  name: string;
  currentBranch: string | null;
  createdAt: number;
  updatedAt: number;
};

export type ProjectInput = {
  path: string;
  name: string;
  currentBranch: string | null;
};
