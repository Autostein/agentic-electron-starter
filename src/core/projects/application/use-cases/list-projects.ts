import type { Project, ProjectRepository } from '../../domain';

export type ListProjectsDeps = {
  projectRepository: ProjectRepository;
};

export function listProjects(deps: ListProjectsDeps): Promise<Project[]> {
  return deps.projectRepository.listProjects();
}
