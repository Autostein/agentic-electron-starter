import { z } from 'zod';

export const WORKSPACES_IPC_CHANNELS = {
  create: 'workspaces:create',
  update: 'workspaces:update',
  list: 'workspaces:list',
  get: 'workspaces:get',
  pickFolder: 'workspaces:pick-folder',
  updateFolder: 'workspaces:update-folder',
  removeFolder: 'workspaces:remove-folder',
} as const;

export const WorkspaceSummaryResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  folderCount: z.number().int().nonnegative(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const WorkspaceFolderResultSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  label: z.string(),
  path: z.string(),
  currentBranch: z.string().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const WorkspaceDetailResultSchema = WorkspaceSummaryResultSchema.omit({
  folderCount: true,
}).extend({
  folders: z.array(WorkspaceFolderResultSchema),
});

export const CreateWorkspaceInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export const UpdateWorkspaceInputSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(120),
});

export const GetWorkspaceInputSchema = z.object({
  id: z.string().min(1),
});

export const PickWorkspaceFolderInputSchema = z.object({
  workspaceId: z.string().min(1),
});

export const UpdateWorkspaceFolderInputSchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(1).max(120),
});

export const RemoveWorkspaceFolderInputSchema = z.object({
  id: z.string().min(1),
});

export const WorkspacesListResultSchema = z.array(WorkspaceSummaryResultSchema);

export type WorkspaceSummaryResult = z.infer<typeof WorkspaceSummaryResultSchema>;
export type WorkspaceFolderResult = z.infer<typeof WorkspaceFolderResultSchema>;
export type WorkspaceDetailResult = z.infer<typeof WorkspaceDetailResultSchema>;
export type CreateWorkspaceInput = z.input<typeof CreateWorkspaceInputSchema>;
export type UpdateWorkspaceInput = z.input<typeof UpdateWorkspaceInputSchema>;
export type GetWorkspaceInput = z.infer<typeof GetWorkspaceInputSchema>;
export type PickWorkspaceFolderInput = z.infer<typeof PickWorkspaceFolderInputSchema>;
export type UpdateWorkspaceFolderInput = z.input<typeof UpdateWorkspaceFolderInputSchema>;
export type RemoveWorkspaceFolderInput = z.infer<typeof RemoveWorkspaceFolderInputSchema>;
