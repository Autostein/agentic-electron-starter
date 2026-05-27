import { z } from 'zod';

export const PROJECTS_IPC_CHANNELS = {
  pick: 'projects:pick',
  list: 'projects:list',
} as const;

export const ProjectResultSchema = z.object({
  id: z.string(),
  path: z.string(),
  name: z.string(),
  currentBranch: z.string().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const ProjectsListResultSchema = z.array(ProjectResultSchema);

export type ProjectResult = z.infer<typeof ProjectResultSchema>;
