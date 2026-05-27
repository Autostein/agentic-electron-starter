export type AgentProviderId = 'claude-code' | 'codex';

export type AgentRuntimeSettings = {
  dockerImageName: string;
  claudeDefaultModel: string;
  codexDefaultModel: string;
  claudeAuthMountEnabled: boolean;
  claudeAuthHostPath: string;
  codexAuthMountEnabled: boolean;
  codexAuthHostPath: string;
  updatedAt: number;
};

export type UpdateAgentRuntimeSettings = Partial<
  Omit<AgentRuntimeSettings, 'updatedAt'>
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
};
