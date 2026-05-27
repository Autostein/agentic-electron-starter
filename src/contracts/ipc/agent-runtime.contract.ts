import { z } from 'zod';

export const AGENT_RUNTIME_IPC_CHANNELS = {
  getSettings: 'agent-runtime:get-settings',
  updateSettings: 'agent-runtime:update-settings',
  getImageStatus: 'agent-runtime:get-image-status',
  buildImage: 'agent-runtime:build-image',
  buildEvent: 'agent-runtime:build-event',
} as const;

export const AgentRuntimeSettingsResultSchema = z.object({
  dockerImageName: z.string().min(1),
  claudeDefaultModel: z.string().min(1),
  codexDefaultModel: z.string().min(1),
  claudeAuthMountEnabled: z.boolean(),
  claudeAuthHostPath: z.string().min(1),
  codexAuthMountEnabled: z.boolean(),
  codexAuthHostPath: z.string().min(1),
  updatedAt: z.number(),
});

export const UpdateAgentRuntimeSettingsInputSchema = z.object({
  dockerImageName: z.string().min(1).optional(),
  claudeDefaultModel: z.string().min(1).optional(),
  codexDefaultModel: z.string().min(1).optional(),
  claudeAuthMountEnabled: z.boolean().optional(),
  claudeAuthHostPath: z.string().min(1).optional(),
  codexAuthMountEnabled: z.boolean().optional(),
  codexAuthHostPath: z.string().min(1).optional(),
});

export const DockerImageBuildEventSchema = z.object({
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

export type AgentRuntimeSettingsResult = z.infer<typeof AgentRuntimeSettingsResultSchema>;
export type UpdateAgentRuntimeSettingsInput = z.infer<typeof UpdateAgentRuntimeSettingsInputSchema>;
export type DockerImageBuildEventResult = z.infer<typeof DockerImageBuildEventSchema>;
export type DockerImageBuildResult = z.infer<typeof DockerImageBuildResultSchema>;
export type DockerImageStatusResult = z.infer<typeof DockerImageStatusResultSchema>;
