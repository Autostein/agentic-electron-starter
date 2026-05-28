import { ipcRenderer } from 'electron';
import {
  AGENT_RUNTIME_IPC_CHANNELS,
  DockerImageBuildEventSchema,
  type AgentProviderAuthStatusResult,
  type AgentRuntimeProfileResult,
  type DockerImageBuildResult,
  type DockerImageStatusResult,
  type RuntimeProfileDockerfileResult,
  type UpdateRuntimeProfileDockerfileResult,
} from '@/contracts/ipc/agent-runtime.contract';
import type { DesktopApi } from '@/contracts/ipc/shared/desktop-api';
import type { IpcRendererEvent } from 'electron';
import { invokeIpc } from './invoke-ipc';

export const agentRuntimeBridge: DesktopApi['agentRuntime'] = {
  listProviderAuthStatuses: () => invokeIpc<AgentProviderAuthStatusResult[]>(
    AGENT_RUNTIME_IPC_CHANNELS.listProviderAuthStatuses,
  ),
  listProfiles: () => invokeIpc<AgentRuntimeProfileResult[]>(
    AGENT_RUNTIME_IPC_CHANNELS.listProfiles,
  ),
  getProfile: (input) => invokeIpc<AgentRuntimeProfileResult>(
    AGENT_RUNTIME_IPC_CHANNELS.getProfile,
    input,
  ),
  updateProfile: (input) => invokeIpc<AgentRuntimeProfileResult>(
    AGENT_RUNTIME_IPC_CHANNELS.updateProfile,
    input,
  ),
  duplicateStarterProfile: (input) => invokeIpc<AgentRuntimeProfileResult>(
    AGENT_RUNTIME_IPC_CHANNELS.duplicateStarterProfile,
    input,
  ),
  getProfileDockerfile: (input) => invokeIpc<RuntimeProfileDockerfileResult>(
    AGENT_RUNTIME_IPC_CHANNELS.getProfileDockerfile,
    input,
  ),
  updateProfileDockerfile: (input) => invokeIpc<UpdateRuntimeProfileDockerfileResult>(
    AGENT_RUNTIME_IPC_CHANNELS.updateProfileDockerfile,
    input,
  ),
  resetProfileDockerfile: (input) => invokeIpc<UpdateRuntimeProfileDockerfileResult>(
    AGENT_RUNTIME_IPC_CHANNELS.resetProfileDockerfile,
    input,
  ),
  openProfileFolder: (input) => invokeIpc<void>(
    AGENT_RUNTIME_IPC_CHANNELS.openProfileFolder,
    input,
  ),
  getImageStatus: (input) => invokeIpc<DockerImageStatusResult>(
    AGENT_RUNTIME_IPC_CHANNELS.getImageStatus,
    input,
  ),
  buildImage: (input) => invokeIpc<DockerImageBuildResult>(
    AGENT_RUNTIME_IPC_CHANNELS.buildImage,
    input,
  ),
  onBuildEvent: (callback) => {
    const listener = (_event: IpcRendererEvent, payload: unknown) => {
      callback(DockerImageBuildEventSchema.parse(payload));
    };

    ipcRenderer.on(AGENT_RUNTIME_IPC_CHANNELS.buildEvent, listener);

    return () => {
      ipcRenderer.removeListener(AGENT_RUNTIME_IPC_CHANNELS.buildEvent, listener);
    };
  },
};
