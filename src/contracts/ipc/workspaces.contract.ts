import { z } from 'zod';

export const WORKSPACES_IPC_CHANNELS = {
  pick: 'workspaces:pick',
  list: 'workspaces:list',
} as const;

export const WorkspaceResultSchema = z.object({
  id: z.string(),
  path: z.string(),
  name: z.string(),
  currentBranch: z.string().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const WorkspacesListResultSchema = z.array(WorkspaceResultSchema);

export type WorkspaceResult = z.infer<typeof WorkspaceResultSchema>;
