import { contextBridge, ipcRenderer } from 'electron';
import {
  AGENT_RUNS_IPC_CHANNELS,
  AgentRunEventSchema,
} from '../../infrastructure/ipc/agent-runs.contract';
import {
  AGENT_RUNTIME_IPC_CHANNELS,
  DockerImageBuildEventSchema,
} from '../../infrastructure/ipc/agent-runtime.contract';
import { APP_INFO_IPC_CHANNELS } from '../../infrastructure/ipc/app-info.contract';
import { NOTES_IPC_CHANNELS } from '../../infrastructure/ipc/notes.contract';
import { PROJECTS_IPC_CHANNELS } from '../../infrastructure/ipc/projects.contract';
import type { DesktopApi } from '../../infrastructure/ipc/shared/desktop-api';

const desktopApi: DesktopApi = {
  appInfo: {
    get: () => ipcRenderer.invoke(APP_INFO_IPC_CHANNELS.get),
  },
  projects: {
    pick: () => ipcRenderer.invoke(PROJECTS_IPC_CHANNELS.pick),
    list: () => ipcRenderer.invoke(PROJECTS_IPC_CHANNELS.list),
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
    getSettings: () => ipcRenderer.invoke(AGENT_RUNTIME_IPC_CHANNELS.getSettings),
    updateSettings: (input) => ipcRenderer.invoke(
      AGENT_RUNTIME_IPC_CHANNELS.updateSettings,
      input,
    ),
    getImageStatus: () => ipcRenderer.invoke(AGENT_RUNTIME_IPC_CHANNELS.getImageStatus),
    buildImage: () => ipcRenderer.invoke(AGENT_RUNTIME_IPC_CHANNELS.buildImage),
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
