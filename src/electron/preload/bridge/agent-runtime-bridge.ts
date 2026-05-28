import { ipcRenderer } from 'electron';
import {
  AGENT_RUNTIME_IPC_CHANNELS,
  DockerImageBuildEventSchema,
} from '@/contracts/ipc/agent-runtime.contract';
import type { DesktopApi } from '@/contracts/ipc/shared/desktop-api';
import type { IpcRendererEvent } from 'electron';

export const agentRuntimeBridge: DesktopApi['agentRuntime'] = {
  listProfiles: () => ipcRenderer.invoke(AGENT_RUNTIME_IPC_CHANNELS.listProfiles),
  getProfile: (input) => ipcRenderer.invoke(AGENT_RUNTIME_IPC_CHANNELS.getProfile, input),
  updateProfile: (input) => ipcRenderer.invoke(
    AGENT_RUNTIME_IPC_CHANNELS.updateProfile,
    input,
  ),
  duplicateStarterProfile: (input) => ipcRenderer.invoke(
    AGENT_RUNTIME_IPC_CHANNELS.duplicateStarterProfile,
    input,
  ),
  getProfileDockerfile: (input) => ipcRenderer.invoke(
    AGENT_RUNTIME_IPC_CHANNELS.getProfileDockerfile,
    input,
  ),
  updateProfileDockerfile: (input) => ipcRenderer.invoke(
    AGENT_RUNTIME_IPC_CHANNELS.updateProfileDockerfile,
    input,
  ),
  resetProfileDockerfile: (input) => ipcRenderer.invoke(
    AGENT_RUNTIME_IPC_CHANNELS.resetProfileDockerfile,
    input,
  ),
  openProfileFolder: (input) => ipcRenderer.invoke(
    AGENT_RUNTIME_IPC_CHANNELS.openProfileFolder,
    input,
  ),
  getImageStatus: (input) => ipcRenderer.invoke(
    AGENT_RUNTIME_IPC_CHANNELS.getImageStatus,
    input,
  ),
  buildImage: (input) => ipcRenderer.invoke(AGENT_RUNTIME_IPC_CHANNELS.buildImage, input),
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
