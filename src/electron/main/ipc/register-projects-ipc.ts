import { ipcMain } from 'electron';
import { listProjects } from '../../../application/use-cases/projects/list-projects';
import { registerProject } from '../../../application/use-cases/projects/register-project';
import type { GitRepositoryInspector, ProjectRepository } from '../../../domain/projects';
import {
  PROJECTS_IPC_CHANNELS,
  ProjectResultSchema,
  ProjectsListResultSchema,
  type ProjectResult,
} from '../../../infrastructure/ipc/projects.contract';

export type ProjectsIpcDeps = {
  gitRepositoryInspector: GitRepositoryInspector;
  projectRepository: ProjectRepository;
  pickDirectory: () => Promise<string | null>;
  now: () => number;
};

export function createProjectsIpcHandlers(deps: ProjectsIpcDeps) {
  return {
    list: async (): Promise<ProjectResult[]> => {
      const projects = await listProjects({ projectRepository: deps.projectRepository });
      return ProjectsListResultSchema.parse(projects);
    },
    pick: async (): Promise<ProjectResult | null> => {
      const directory = await deps.pickDirectory();

      if (!directory) {
        return null;
      }

      const project = await registerProject(directory, {
        gitRepositoryInspector: deps.gitRepositoryInspector,
        projectRepository: deps.projectRepository,
        now: deps.now,
      });

      return ProjectResultSchema.parse(project);
    },
  };
}

export function registerProjectsIpcHandlers(deps: ProjectsIpcDeps): void {
  const handlers = createProjectsIpcHandlers(deps);
  ipcMain.handle(PROJECTS_IPC_CHANNELS.list, handlers.list);
  ipcMain.handle(PROJECTS_IPC_CHANNELS.pick, handlers.pick);
}
