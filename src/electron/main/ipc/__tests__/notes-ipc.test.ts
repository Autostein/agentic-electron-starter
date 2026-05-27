import { describe, expect, it } from 'vitest';
import type { CreateNoteRecord, Note, NoteRepository } from '@/core/notes/domain';
import { createNotesIpcHandlers } from '../register-notes-ipc';

class FakeNoteRepository implements NoteRepository {
  notes: Note[] = [];

  async listNotes(): Promise<Note[]> {
    return this.notes;
  }

  async createNote(note: CreateNoteRecord): Promise<Note> {
    this.notes.unshift(note);
    return note;
  }

  async deleteNote(id: string): Promise<void> {
    this.notes = this.notes.filter((note) => note.id !== id);
  }
}

describe('notes IPC handlers', () => {
  it('validates create input and delegates to use-case', async () => {
    const noteRepository = new FakeNoteRepository();
    const handlers = createNotesIpcHandlers({ noteRepository });

    const result = await handlers.create(null, {
      title: 'IPC note',
      body: 'Created over IPC',
    });

    expect(result).toMatchObject({
      title: 'IPC note',
      body: 'Created over IPC',
    });
    expect(result.id).toEqual(expect.any(String));
    await expect(handlers.list()).resolves.toEqual([result]);
  });

  it('rejects invalid create payloads', async () => {
    const handlers = createNotesIpcHandlers({ noteRepository: new FakeNoteRepository() });

    await expect(handlers.create(null, { title: '' })).rejects.toThrow();
  });

  it('validates delete input and delegates to repository', async () => {
    const noteRepository = new FakeNoteRepository();
    const handlers = createNotesIpcHandlers({ noteRepository });
    const result = await handlers.create(null, { title: 'Delete me' });

    await handlers.delete(null, { id: result.id });

    await expect(handlers.list()).resolves.toEqual([]);
  });
});
