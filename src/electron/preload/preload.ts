import { contextBridge, ipcRenderer } from 'electron';
import { APP_INFO_IPC_CHANNELS } from '../../infrastructure/ipc/app-info.contract';
import { NOTES_IPC_CHANNELS } from '../../infrastructure/ipc/notes.contract';
import type { DesktopApi } from '../../infrastructure/ipc/shared/desktop-api';

const desktopApi: DesktopApi = {
  appInfo: {
    get: () => ipcRenderer.invoke(APP_INFO_IPC_CHANNELS.get),
  },
  notes: {
    list: () => ipcRenderer.invoke(NOTES_IPC_CHANNELS.list),
    create: (input) => ipcRenderer.invoke(NOTES_IPC_CHANNELS.create, input),
    delete: (input) => ipcRenderer.invoke(NOTES_IPC_CHANNELS.delete, input),
  },
};

contextBridge.exposeInMainWorld('desktop', desktopApi);
