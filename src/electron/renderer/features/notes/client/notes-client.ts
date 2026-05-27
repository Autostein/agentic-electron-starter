import type { CreateNoteInput, DeleteNoteInput } from '@/infrastructure/ipc/notes.contract';

export function listNotes() {
  return window.desktop.notes.list();
}

export function createNote(input: CreateNoteInput) {
  return window.desktop.notes.create(input);
}

export function deleteNote(input: DeleteNoteInput) {
  return window.desktop.notes.delete(input);
}
