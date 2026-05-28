import { ipcRenderer } from 'electron';
import { APP_INFO_IPC_CHANNELS } from '@/contracts/ipc/app-info.contract';
import type { DesktopApi } from '@/contracts/ipc/shared/desktop-api';

export const appInfoBridge: DesktopApi['appInfo'] = {
  get: () => ipcRenderer.invoke(APP_INFO_IPC_CHANNELS.get),
};
