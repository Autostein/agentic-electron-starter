import { z } from 'zod';

export const AGENT_RUNTIME_IPC_CHANNELS = {
  listProfiles: 'agent-runtime:list-profiles',
  getProfile: 'agent-runtime:get-profile',
  updateProfile: 'agent-runtime:update-profile',
  duplicateStarterProfile: 'agent-runtime:duplicate-starter-profile',
  getProfileDockerfile: 'agent-runtime:get-profile-dockerfile',
  updateProfileDockerfile: 'agent-runtime:update-profile-dockerfile',
  resetProfileDockerfile: 'agent-runtime:reset-profile-dockerfile',
  openProfileFolder: 'agent-runtime:open-profile-folder',
  getImageStatus: 'agent-runtime:get-image-status',
  buildImage: 'agent-runtime:build-image',
  buildEvent: 'agent-runtime:build-event',
} as const;

export const AgentRuntimeProfileSourceKindSchema = z.enum([
  'bundled-starter',
  'user-managed-copy',
]);

export const AgentRuntimeProfileResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  sourceKind: AgentRuntimeProfileSourceKindSchema,
  profilePath: z.string().nullable(),
  imageName: z.string(),
  claudeAuthMountEnabled: z.boolean(),
  codexAuthMountEnabled: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const AgentRuntimeProfileListResultSchema = z.array(AgentRuntimeProfileResultSchema);

export const GetAgentRuntimeProfileInputSchema = z.object({
  id: z.string().min(1),
});

export const UpdateAgentRuntimeProfileInputSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  claudeAuthMountEnabled: z.boolean().optional(),
  codexAuthMountEnabled: z.boolean().optional(),
});

export const DuplicateStarterRuntimeProfileInputSchema = z.object({
  name: z.string().min(1).optional(),
}).optional();

export const RuntimeProfileImageInputSchema = z.object({
  profileId: z.string().min(1),
});

export const RuntimeProfileDockerfileInputSchema = z.object({
  profileId: z.string().min(1),
});

export const UpdateRuntimeProfileDockerfileInputSchema = z.object({
  profileId: z.string().min(1),
  content: z.string(),
});

export const RuntimeProfileDockerfileResultSchema = z.object({
  profileId: z.string(),
  content: z.string(),
  editable: z.boolean(),
  path: z.string(),
});

export const UpdateRuntimeProfileDockerfileResultSchema = z.object({
  profileId: z.string(),
  content: z.string(),
  savedAt: z.number(),
});

export const DockerImageBuildEventSchema = z.object({
  profileId: z.string(),
  type: z.enum(['log', 'error', 'complete']),
  message: z.string(),
  createdAt: z.number(),
});

export const DockerImageBuildResultSchema = z.object({
  imageName: z.string(),
  succeeded: z.boolean(),
});

export const DockerImageStatusResultSchema = z.object({
  imageName: z.string().min(1),
  available: z.boolean(),
  checkedAt: z.number(),
  errorMessage: z.string().optional(),
});

export type AgentRuntimeProfileSourceKindResult = z.infer<typeof AgentRuntimeProfileSourceKindSchema>;
export type AgentRuntimeProfileResult = z.infer<typeof AgentRuntimeProfileResultSchema>;
export type GetAgentRuntimeProfileInput = z.infer<typeof GetAgentRuntimeProfileInputSchema>;
export type UpdateAgentRuntimeProfileInput = z.infer<typeof UpdateAgentRuntimeProfileInputSchema>;
export type DuplicateStarterRuntimeProfileInput = z.infer<typeof DuplicateStarterRuntimeProfileInputSchema>;
export type RuntimeProfileImageInput = z.infer<typeof RuntimeProfileImageInputSchema>;
export type RuntimeProfileDockerfileInput = z.infer<typeof RuntimeProfileDockerfileInputSchema>;
export type UpdateRuntimeProfileDockerfileInput = z.infer<typeof UpdateRuntimeProfileDockerfileInputSchema>;
export type RuntimeProfileDockerfileResult = z.infer<typeof RuntimeProfileDockerfileResultSchema>;
export type UpdateRuntimeProfileDockerfileResult = z.infer<typeof UpdateRuntimeProfileDockerfileResultSchema>;
export type DockerImageBuildEventResult = z.infer<typeof DockerImageBuildEventSchema>;
export type DockerImageBuildResult = z.infer<typeof DockerImageBuildResultSchema>;
export type DockerImageStatusResult = z.infer<typeof DockerImageStatusResultSchema>;
