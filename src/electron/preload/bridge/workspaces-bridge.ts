import { ipcRenderer } from 'electron';
import type { DesktopApi } from '@/contracts/ipc/shared/desktop-api';
import { WORKSPACES_IPC_CHANNELS } from '@/contracts/ipc/workspaces.contract';

export const workspacesBridge: DesktopApi['workspaces'] = {
  pick: () => ipcRenderer.invoke(WORKSPACES_IPC_CHANNELS.pick),
  list: () => ipcRenderer.invoke(WORKSPACES_IPC_CHANNELS.list),
};
