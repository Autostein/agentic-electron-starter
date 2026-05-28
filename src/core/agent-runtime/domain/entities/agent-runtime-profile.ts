import type { AppErrorCode } from '@/shared/app-errors';

export type AgentProviderId = 'claude-code' | 'codex';

export type AgentRuntimeProfileSourceKind = 'bundled-starter' | 'user-managed-copy';

export type AgentRuntimeProfile = {
  id: string;
  name: string;
  sourceKind: AgentRuntimeProfileSourceKind;
  profilePath: string | null;
  imageName: string;
  claudeAuthMountEnabled: boolean;
  codexAuthMountEnabled: boolean;
  createdAt: number;
  updatedAt: number;
};

export type CreateAgentRuntimeProfile = Omit<AgentRuntimeProfile, 'createdAt' | 'updatedAt'>;

export type UpdateAgentRuntimeProfile = Partial<
  Pick<
    AgentRuntimeProfile,
    | 'name'
    | 'claudeAuthMountEnabled'
    | 'codexAuthMountEnabled'
  >
>;

export type DockerImageBuildEvent = {
  type: 'log' | 'error' | 'complete';
  message: string;
  createdAt: number;
};

export type DockerImageStatus = {
  imageName: string;
  available: boolean;
  checkedAt: number;
  errorMessage?: string;
  errorCode?: Extract<AppErrorCode, 'DOCKER_UNAVAILABLE' | 'IMAGE_MISSING'>;
};

export const STARTER_RUNTIME_PROFILE_ID = 'starter';

export function toRuntimeProfileImageName(profileId: string): string {
  return `agentic-electron-starter-runtime:${profileId}`;
}
