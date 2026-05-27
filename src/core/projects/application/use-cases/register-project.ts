import type {
  GitRepositoryInspector,
  Project,
  ProjectRepository,
} from '../../domain';

export type RegisterProjectDeps = {
  gitRepositoryInspector: GitRepositoryInspector;
  projectRepository: ProjectRepository;
  now: () => number;
};

export async function registerProject(
  path: string,
  deps: RegisterProjectDeps,
): Promise<Project> {
  const info = await deps.gitRepositoryInspector.inspect(path);
  const now = deps.now();

  return deps.projectRepository.upsertProject(
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
