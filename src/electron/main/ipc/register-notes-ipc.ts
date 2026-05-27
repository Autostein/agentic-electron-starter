import { randomUUID } from 'node:crypto';
import { ipcMain } from 'electron';
import { createNote } from '@/core/notes/application/use-cases/create-note';
import { deleteNote } from '@/core/notes/application/use-cases/delete-note';
import { listNotes } from '@/core/notes/application/use-cases/list-notes';
import type { NoteRepository } from '@/core/notes/domain';
import {
  CreateNoteInputSchema,
  DeleteNoteInputSchema,
  NOTES_IPC_CHANNELS,
  NoteResultSchema,
  NotesListResultSchema,
  type NoteResult,
} from '@/contracts/ipc/notes.contract';

export type NotesIpcDeps = {
  noteRepository: NoteRepository;
};

export function createNotesIpcHandlers(deps: NotesIpcDeps) {
  return {
    list: async (): Promise<NoteResult[]> => {
      const notes = await listNotes({ noteRepository: deps.noteRepository });
      return NotesListResultSchema.parse(notes);
    },
    create: async (_event: unknown, payload: unknown): Promise<NoteResult> => {
      const input = CreateNoteInputSchema.parse(payload);
      const note = await createNote(input, {
        createId: randomUUID,
        noteRepository: deps.noteRepository,
        now: Date.now,
      });

      return NoteResultSchema.parse(note);
    },
    delete: async (_event: unknown, payload: unknown): Promise<void> => {
      const input = DeleteNoteInputSchema.parse(payload);
      await deleteNote(input.id, { noteRepository: deps.noteRepository });
    },
  };
}

export function registerNotesIpcHandlers(deps: NotesIpcDeps): void {
  const handlers = createNotesIpcHandlers(deps);
  ipcMain.handle(NOTES_IPC_CHANNELS.list, handlers.list);
  ipcMain.handle(NOTES_IPC_CHANNELS.create, handlers.create);
  ipcMain.handle(NOTES_IPC_CHANNELS.delete, handlers.delete);
}
