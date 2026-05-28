import {
  NOTES_IPC_CHANNELS,
  type NoteResult,
} from '@/contracts/ipc/notes.contract';
import type { DesktopApi } from '@/contracts/ipc/shared/desktop-api';
import { invokeIpc } from './invoke-ipc';

export const notesBridge: DesktopApi['notes'] = {
  list: () => invokeIpc<NoteResult[]>(NOTES_IPC_CHANNELS.list),
  create: (input) => invokeIpc<NoteResult>(NOTES_IPC_CHANNELS.create, input),
  delete: (input) => invokeIpc<void>(NOTES_IPC_CHANNELS.delete, input),
};
