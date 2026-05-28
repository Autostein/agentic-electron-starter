import { randomUUID } from 'node:crypto';
import { ipcMain } from 'electron';
import { buildSandboxImage } from '@/core/agent-runtime/application/use-cases/build-sandbox-image';
import { duplicateStarterRuntimeProfile } from '@/core/agent-runtime/application/use-cases/duplicate-starter-runtime-profile';
import { getRuntimeProfile } from '@/core/agent-runtime/application/use-cases/get-runtime-profile';
import { getSandboxImageStatus } from '@/core/agent-runtime/application/use-cases/get-sandbox-image-status';
import { listRuntimeProfiles } from '@/core/agent-runtime/application/use-cases/list-runtime-profiles';
import { updateRuntimeProfile } from '@/core/agent-runtime/application/use-cases/update-runtime-profile';
import type {
  AgentRuntimeProfile,
  AgentRuntimeProfileRepository,
  DockerImageBuilder,
  DockerImageBuildEvent,
} from '@/core/agent-runtime/domain';
import {
  AGENT_RUNTIME_IPC_CHANNELS,
  AgentRuntimeProfileListResultSchema,
  AgentRuntimeProfileResultSchema,
  DockerImageBuildResultSchema,
  DockerImageStatusResultSchema,
  DuplicateStarterRuntimeProfileInputSchema,
  GetAgentRuntimeProfileInputSchema,
  RuntimeProfileDockerfileInputSchema,
  RuntimeProfileDockerfileResultSchema,
  RuntimeProfileImageInputSchema,
  UpdateRuntimeProfileDockerfileInputSchema,
  UpdateRuntimeProfileDockerfileResultSchema,
  UpdateAgentRuntimeProfileInputSchema,
  type AgentRuntimeProfileResult,
  type DockerImageBuildEventResult,
  type DockerImageBuildResult,
  type DockerImageStatusResult,
  type RuntimeProfileDockerfileResult,
  type UpdateRuntimeProfileDockerfileResult,
} from '@/contracts/ipc/agent-runtime.contract';
import type { RuntimeProfileDockerfile } from '@/infrastructure/main/agent-runtime/runtime-profile-files';

export type AgentRuntimeIpcDeps = {
  dockerImageBuilder: DockerImageBuilder;
  profileRepository: AgentRuntimeProfileRepository;
  copyStarterProfile: (profileId: string) => string;
  runtimeProfileFiles: {
    readDockerfile: (profile: AgentRuntimeProfile) => RuntimeProfileDockerfile;
    writeDockerfile: (profile: AgentRuntimeProfile, content: string) => string;
    resetDockerfile: (profile: AgentRuntimeProfile) => string;
    openProfileFolder: (profile: AgentRuntimeProfile) => Promise<void>;
  };
  validateRuntimeProfile: (profile: AgentRuntimeProfile) => void | Promise<void>;
  now: () => number;
  publishBuildEvent: (event: DockerImageBuildEventResult) => void;
};

export function createAgentRuntimeIpcHandlers(deps: AgentRuntimeIpcDeps) {
  let activeBuild: Promise<DockerImageBuildResult> | null = null;

  return {
    listProfiles: async (): Promise<AgentRuntimeProfileResult[]> => {
      const profiles = await listRuntimeProfiles({ profileRepository: deps.profileRepository });
      return AgentRuntimeProfileListResultSchema.parse(profiles);
    },
    getProfile: async (_event: unknown, payload: unknown): Promise<AgentRuntimeProfileResult> => {
      const input = GetAgentRuntimeProfileInputSchema.parse(payload);
      const profile = await getRuntimeProfile(input.id, {
        profileRepository: deps.profileRepository,
      });

      if (!profile) {
        throw new Error('Runtime profile not found.');
      }

      return AgentRuntimeProfileResultSchema.parse(profile);
    },
    updateProfile: async (_event: unknown, payload: unknown): Promise<AgentRuntimeProfileResult> => {
      const input = UpdateAgentRuntimeProfileInputSchema.parse(payload);
      const current = await getRequiredProfile(input.id, deps.profileRepository);
      const candidate = { ...current, ...input };
      await deps.validateRuntimeProfile(candidate);
      const profile = await updateRuntimeProfile(input.id, input, {
        profileRepository: deps.profileRepository,
        now: deps.now,
      });

      return AgentRuntimeProfileResultSchema.parse(profile);
    },
    duplicateStarterProfile: async (
      _event: unknown,
      payload: unknown,
    ): Promise<AgentRuntimeProfileResult> => {
      const input = DuplicateStarterRuntimeProfileInputSchema.parse(payload) ?? {};
      const profile = await duplicateStarterRuntimeProfile(input, {
        profileRepository: deps.profileRepository,
        copyStarterProfile: deps.copyStarterProfile,
        createId: randomUUID,
        now: deps.now,
      });

      return AgentRuntimeProfileResultSchema.parse(profile);
    },
    getProfileDockerfile: async (
      _event: unknown,
      payload: unknown,
    ): Promise<RuntimeProfileDockerfileResult> => {
      const input = RuntimeProfileDockerfileInputSchema.parse(payload);
      const profile = await getRequiredProfile(input.profileId, deps.profileRepository);
      const dockerfile = deps.runtimeProfileFiles.readDockerfile(profile);

      return RuntimeProfileDockerfileResultSchema.parse({
        profileId: profile.id,
        ...dockerfile,
      });
    },
    updateProfileDockerfile: async (
      _event: unknown,
      payload: unknown,
    ): Promise<UpdateRuntimeProfileDockerfileResult> => {
      const input = UpdateRuntimeProfileDockerfileInputSchema.parse(payload);
      const profile = await getRequiredProfile(input.profileId, deps.profileRepository);
      const content = deps.runtimeProfileFiles.writeDockerfile(profile, input.content);

      return UpdateRuntimeProfileDockerfileResultSchema.parse({
        profileId: profile.id,
        content,
        savedAt: deps.now(),
      });
    },
    resetProfileDockerfile: async (
      _event: unknown,
      payload: unknown,
    ): Promise<UpdateRuntimeProfileDockerfileResult> => {
      const input = RuntimeProfileDockerfileInputSchema.parse(payload);
      const profile = await getRequiredProfile(input.profileId, deps.profileRepository);
      const content = deps.runtimeProfileFiles.resetDockerfile(profile);

      return UpdateRuntimeProfileDockerfileResultSchema.parse({
        profileId: profile.id,
        content,
        savedAt: deps.now(),
      });
    },
    openProfileFolder: async (_event: unknown, payload: unknown): Promise<void> => {
      const input = RuntimeProfileDockerfileInputSchema.parse(payload);
      const profile = await getRequiredProfile(input.profileId, deps.profileRepository);
      await deps.runtimeProfileFiles.openProfileFolder(profile);
    },
    getImageStatus: async (_event: unknown, payload: unknown): Promise<DockerImageStatusResult> => {
      const input = RuntimeProfileImageInputSchema.parse(payload);
      const profile = await getRequiredProfile(input.profileId, deps.profileRepository);
      const status = await getSandboxImageStatus({
        dockerImageBuilder: deps.dockerImageBuilder,
        profile,
        now: deps.now,
      });

      return DockerImageStatusResultSchema.parse(status);
    },
    buildImage: async (_event: unknown, payload: unknown): Promise<DockerImageBuildResult> => {
      const input = RuntimeProfileImageInputSchema.parse(payload);

      if (activeBuild) {
        throw new Error('Docker image build is already running.');
      }

      activeBuild = (async () => {
        const profile = await getRequiredProfile(input.profileId, deps.profileRepository);
        const result = await buildSandboxImage({
          dockerImageBuilder: deps.dockerImageBuilder,
          profile,
          onEvent: (event: DockerImageBuildEvent) => {
            deps.publishBuildEvent({ ...event, profileId: profile.id });
          },
        });

        return DockerImageBuildResultSchema.parse(result);
      })();

      try {
        return await activeBuild;
      } finally {
        activeBuild = null;
      }
    },
  };
}

export function registerAgentRuntimeIpcHandlers(deps: AgentRuntimeIpcDeps): void {
  const handlers = createAgentRuntimeIpcHandlers(deps);
  ipcMain.handle(AGENT_RUNTIME_IPC_CHANNELS.listProfiles, handlers.listProfiles);
  ipcMain.handle(AGENT_RUNTIME_IPC_CHANNELS.getProfile, handlers.getProfile);
  ipcMain.handle(AGENT_RUNTIME_IPC_CHANNELS.updateProfile, handlers.updateProfile);
  ipcMain.handle(
    AGENT_RUNTIME_IPC_CHANNELS.duplicateStarterProfile,
    handlers.duplicateStarterProfile,
  );
  ipcMain.handle(
    AGENT_RUNTIME_IPC_CHANNELS.getProfileDockerfile,
    handlers.getProfileDockerfile,
  );
  ipcMain.handle(
    AGENT_RUNTIME_IPC_CHANNELS.updateProfileDockerfile,
    handlers.updateProfileDockerfile,
  );
  ipcMain.handle(
    AGENT_RUNTIME_IPC_CHANNELS.resetProfileDockerfile,
    handlers.resetProfileDockerfile,
  );
  ipcMain.handle(AGENT_RUNTIME_IPC_CHANNELS.openProfileFolder, handlers.openProfileFolder);
  ipcMain.handle(AGENT_RUNTIME_IPC_CHANNELS.getImageStatus, handlers.getImageStatus);
  ipcMain.handle(AGENT_RUNTIME_IPC_CHANNELS.buildImage, handlers.buildImage);
}

async function getRequiredProfile(
  id: string,
  profileRepository: AgentRuntimeProfileRepository,
): Promise<AgentRuntimeProfile> {
  const profile = await profileRepository.getProfile(id);

  if (!profile) {
    throw new Error('Runtime profile not found.');
  }

  return profile;
}
