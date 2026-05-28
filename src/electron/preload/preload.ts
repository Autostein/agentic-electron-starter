import { contextBridge, ipcRenderer } from 'electron';
import {
  AGENT_RUNS_IPC_CHANNELS,
  AgentRunEventSchema,
} from '@/contracts/ipc/agent-runs.contract';
import {
  AGENT_RUNTIME_IPC_CHANNELS,
  DockerImageBuildEventSchema,
} from '@/contracts/ipc/agent-runtime.contract';
import { APP_INFO_IPC_CHANNELS } from '@/contracts/ipc/app-info.contract';
import { NOTES_IPC_CHANNELS } from '@/contracts/ipc/notes.contract';
import { WORKSPACES_IPC_CHANNELS } from '@/contracts/ipc/workspaces.contract';
import type { DesktopApi } from '@/contracts/ipc/shared/desktop-api';

const desktopApi: DesktopApi = {
  appInfo: {
    get: () => ipcRenderer.invoke(APP_INFO_IPC_CHANNELS.get),
  },
  workspaces: {
    pick: () => ipcRenderer.invoke(WORKSPACES_IPC_CHANNELS.pick),
    list: () => ipcRenderer.invoke(WORKSPACES_IPC_CHANNELS.list),
  },
  agentRuns: {
    start: (input) => ipcRenderer.invoke(AGENT_RUNS_IPC_CHANNELS.start, input),
    list: (input) => ipcRenderer.invoke(AGENT_RUNS_IPC_CHANNELS.list, input),
    get: (input) => ipcRenderer.invoke(AGENT_RUNS_IPC_CHANNELS.get, input),
    getCommitDetails: (input) => ipcRenderer.invoke(
      AGENT_RUNS_IPC_CHANNELS.getCommitDetails,
      input,
    ),
    getCommitFileDiff: (input) => ipcRenderer.invoke(
      AGENT_RUNS_IPC_CHANNELS.getCommitFileDiff,
      input,
    ),
    cancel: (input) => ipcRenderer.invoke(AGENT_RUNS_IPC_CHANNELS.cancel, input),
    onEvent: (input, callback) => {
      const listener = (_event: Electron.IpcRendererEvent, payload: unknown) => {
        const event = AgentRunEventSchema.parse(payload);

        if (event.runId === input.runId) {
          callback(event);
        }
      };

      ipcRenderer.on(AGENT_RUNS_IPC_CHANNELS.event, listener);

      return () => {
        ipcRenderer.removeListener(AGENT_RUNS_IPC_CHANNELS.event, listener);
      };
    },
  },
  agentRuntime: {
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
      const listener = (_event: Electron.IpcRendererEvent, payload: unknown) => {
        callback(DockerImageBuildEventSchema.parse(payload));
      };

      ipcRenderer.on(AGENT_RUNTIME_IPC_CHANNELS.buildEvent, listener);

      return () => {
        ipcRenderer.removeListener(AGENT_RUNTIME_IPC_CHANNELS.buildEvent, listener);
      };
    },
  },
  notes: {
    list: () => ipcRenderer.invoke(NOTES_IPC_CHANNELS.list),
    create: (input) => ipcRenderer.invoke(NOTES_IPC_CHANNELS.create, input),
    delete: (input) => ipcRenderer.invoke(NOTES_IPC_CHANNELS.delete, input),
  },
};

contextBridge.exposeInMainWorld('desktop', desktopApi);
