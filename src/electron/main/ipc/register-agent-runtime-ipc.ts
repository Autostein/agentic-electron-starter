import { ipcMain } from 'electron';
import { buildSandboxImage } from '../../../application/use-cases/agent-runtime/build-sandbox-image';
import { getSandboxImageStatus } from '../../../application/use-cases/agent-runtime/get-sandbox-image-status';
import { getRuntimeSettings } from '../../../application/use-cases/agent-runtime/get-runtime-settings';
import { updateRuntimeSettings } from '../../../application/use-cases/agent-runtime/update-runtime-settings';
import type {
  DockerImageBuildEvent,
  DockerImageBuilder,
  AgentRuntimeSettingsRepository,
} from '../../../domain/agent-runtime';
import {
  AGENT_RUNTIME_IPC_CHANNELS,
  AgentRuntimeSettingsResultSchema,
  DockerImageBuildResultSchema,
  DockerImageStatusResultSchema,
  UpdateAgentRuntimeSettingsInputSchema,
  type AgentRuntimeSettingsResult,
  type DockerImageBuildResult,
  type DockerImageStatusResult,
} from '../../../infrastructure/ipc/agent-runtime.contract';

export type AgentRuntimeIpcDeps = {
  dockerImageBuilder: DockerImageBuilder;
  settingsRepository: AgentRuntimeSettingsRepository;
  now: () => number;
  publishBuildEvent: (event: DockerImageBuildEvent) => void;
};

export function createAgentRuntimeIpcHandlers(deps: AgentRuntimeIpcDeps) {
  let activeBuild: Promise<DockerImageBuildResult> | null = null;

  return {
    getSettings: async (): Promise<AgentRuntimeSettingsResult> => {
      const settings = await getRuntimeSettings({ settingsRepository: deps.settingsRepository });
      return AgentRuntimeSettingsResultSchema.parse(settings);
    },
    updateSettings: async (_event: unknown, payload: unknown): Promise<AgentRuntimeSettingsResult> => {
      const input = UpdateAgentRuntimeSettingsInputSchema.parse(payload);
      const settings = await updateRuntimeSettings(input, {
        settingsRepository: deps.settingsRepository,
        now: deps.now,
      });

      return AgentRuntimeSettingsResultSchema.parse(settings);
    },
    getImageStatus: async (): Promise<DockerImageStatusResult> => {
      const settings = await getRuntimeSettings({ settingsRepository: deps.settingsRepository });
      const status = await getSandboxImageStatus({
        dockerImageBuilder: deps.dockerImageBuilder,
        imageName: settings.dockerImageName,
        now: deps.now,
      });

      return DockerImageStatusResultSchema.parse(status);
    },
    buildImage: async (): Promise<DockerImageBuildResult> => {
      if (activeBuild) {
        throw new Error('Docker image build is already running.');
      }

      activeBuild = (async () => {
        const settings = await getRuntimeSettings({ settingsRepository: deps.settingsRepository });
        const result = await buildSandboxImage({
          dockerImageBuilder: deps.dockerImageBuilder,
          imageName: settings.dockerImageName,
          onEvent: deps.publishBuildEvent,
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
  ipcMain.handle(AGENT_RUNTIME_IPC_CHANNELS.getSettings, handlers.getSettings);
  ipcMain.handle(AGENT_RUNTIME_IPC_CHANNELS.updateSettings, handlers.updateSettings);
  ipcMain.handle(AGENT_RUNTIME_IPC_CHANNELS.getImageStatus, handlers.getImageStatus);
  ipcMain.handle(AGENT_RUNTIME_IPC_CHANNELS.buildImage, handlers.buildImage);
}
