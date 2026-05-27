import type { AppInfoResult } from '../app-info.contract';
import type { CreateNoteInput, DeleteNoteInput, NoteResult } from '../notes.contract';

export type DesktopApi = {
  appInfo: {
    get: () => Promise<AppInfoResult>;
  };
  notes: {
    list: () => Promise<NoteResult[]>;
    create: (input: CreateNoteInput) => Promise<NoteResult>;
    delete: (input: DeleteNoteInput) => Promise<void>;
  };
};
