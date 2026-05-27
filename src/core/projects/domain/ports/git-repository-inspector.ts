export type GitRepositoryInfo = {
  path: string;
  name: string;
  currentBranch: string | null;
};

export interface GitRepositoryInspector {
  inspect(path: string): Promise<GitRepositoryInfo>;
}
