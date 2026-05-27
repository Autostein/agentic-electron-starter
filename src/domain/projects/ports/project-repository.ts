import type { Project, ProjectInput } from '../entities/project';

export interface ProjectRepository {
  listProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | null>;
  upsertProject(input: ProjectInput, timestamps: { createdAt: number; updatedAt: number }): Promise<Project>;
}
