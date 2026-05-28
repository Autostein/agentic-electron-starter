import { RuntimeProfileFiles } from '@/infrastructure/main/agent-runtime/runtime-profile-files';
import { SQLiteAgentRuntimeProfileRepository } from '@/infrastructure/main/persistence/sqlite-agent-runtime-profile-repository';
import { LocalDockerImageBuilder } from '@/infrastructure/main/sandcastle/docker-image-builder';

export type AgentRuntimeDepsOptions = {
  userDataPath: string;
  resourcesPath: string;
  isPackaged: boolean;
};

export function createAgentRuntimeDeps(options: AgentRuntimeDepsOptions) {
  return {
    dockerImageBuilder: new LocalDockerImageBuilder({
      userDataPath: options.userDataPath,
      resourcesPath: options.resourcesPath,
      isPackaged: options.isPackaged,
    }),
    profileRepository: new SQLiteAgentRuntimeProfileRepository(),
    runtimeProfileFiles: new RuntimeProfileFiles({
      userDataPath: options.userDataPath,
      resourcesPath: options.resourcesPath,
      isPackaged: options.isPackaged,
    }),
  };
}

export type AgentRuntimeDeps = ReturnType<typeof createAgentRuntimeDeps>;
