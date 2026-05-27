import { describe, expect, it } from 'vitest';
import { createNote } from '../create-note';
import { deleteNote } from '../delete-note';
import { listNotes } from '../list-notes';
import type { CreateNoteRecord, Note, NoteRepository } from '../../../domain';

class FakeNoteRepository implements NoteRepository {
  private notes = new Map<string, Note>();
  deletedIds: string[] = [];

  async listNotes(): Promise<Note[]> {
    return [...this.notes.values()];
  }

  async createNote(note: CreateNoteRecord): Promise<Note> {
    this.notes.set(note.id, note);
    return note;
  }

  async deleteNote(id: string): Promise<void> {
    this.deletedIds.push(id);
    this.notes.delete(id);
  }
}

describe('notes use-cases', () => {
  it('creates and lists notes through the repository port', async () => {
    const noteRepository = new FakeNoteRepository();

    const note = await createNote(
      { title: '  First note  ', body: '  Body  ' },
      {
        createId: () => 'note-1',
        noteRepository,
        now: () => 123,
      },
    );

    expect(note).toEqual({
      id: 'note-1',
      title: 'First note',
      body: 'Body',
      createdAt: 123,
      updatedAt: 123,
    });
    await expect(listNotes({ noteRepository })).resolves.toEqual([note]);
  });

  it('rejects empty note titles', async () => {
    await expect(
      createNote(
        { title: '   ' },
        {
          createId: () => 'note-1',
          noteRepository: new FakeNoteRepository(),
          now: () => 123,
        },
      ),
    ).rejects.toThrowError(/missing note title/i);
  });

  it('deletes notes by id', async () => {
    const noteRepository = new FakeNoteRepository();

    await deleteNote(' note-1 ', { noteRepository });

    expect(noteRepository.deletedIds).toEqual(['note-1']);
  });
});
