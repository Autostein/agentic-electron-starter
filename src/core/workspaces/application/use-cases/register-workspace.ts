import type {
  GitRepositoryInspector,
  Workspace,
  WorkspaceRepository,
} from '../../domain';

export type RegisterWorkspaceDeps = {
  gitRepositoryInspector: GitRepositoryInspector;
  workspaceRepository: WorkspaceRepository;
  now: () => number;
};

export async function registerWorkspace(
  path: string,
  deps: RegisterWorkspaceDeps,
): Promise<Workspace> {
  const info = await deps.gitRepositoryInspector.inspect(path);
  const now = deps.now();

  return deps.workspaceRepository.upsertWorkspace(
    {
      path: info.path,
      name: info.name,
      currentBranch: info.currentBranch,
    },
    {
      createdAt: now,
      updatedAt: now,
    },
  );
}
