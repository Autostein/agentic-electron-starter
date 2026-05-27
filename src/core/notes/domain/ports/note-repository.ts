import type { Note } from '../entities/note';

export type CreateNoteRecord = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
};

export interface NoteRepository {
  listNotes(): Promise<Note[]>;
  createNote(note: CreateNoteRecord): Promise<Note>;
  deleteNote(id: string): Promise<void>;
}
