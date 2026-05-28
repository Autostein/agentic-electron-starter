import { ipcRenderer } from 'electron';
import { NOTES_IPC_CHANNELS } from '@/contracts/ipc/notes.contract';
import type { DesktopApi } from '@/contracts/ipc/shared/desktop-api';

export const notesBridge: DesktopApi['notes'] = {
  list: () => ipcRenderer.invoke(NOTES_IPC_CHANNELS.list),
  create: (input) => ipcRenderer.invoke(NOTES_IPC_CHANNELS.create, input),
  delete: (input) => ipcRenderer.invoke(NOTES_IPC_CHANNELS.delete, input),
};
