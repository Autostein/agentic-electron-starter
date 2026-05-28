import { ipcRenderer } from 'electron';
import {
  AGENT_RUNS_IPC_CHANNELS,
  AgentRunEventSchema,
} from '@/contracts/ipc/agent-runs.contract';
import type { DesktopApi } from '@/contracts/ipc/shared/desktop-api';
import type { IpcRendererEvent } from 'electron';

export const agentRunsBridge: DesktopApi['agentRuns'] = {
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
    const listener = (_event: IpcRendererEvent, payload: unknown) => {
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
};
