import type { CreateNoteRecord, Note, NoteRepository } from '../../../domain/notes';
import { getMainDatabase } from './db/client';

export class SQLiteNoteRepository implements NoteRepository {
  async listNotes(): Promise<Note[]> {
    const db = getMainDatabase();
    const rows = db
      .prepare(
        `
          SELECT
            id,
            title,
            body,
            created_at AS createdAt,
            updated_at AS updatedAt
          FROM notes
          ORDER BY updated_at DESC, created_at DESC
        `,
      )
      .all() as NoteRow[];

    return rows.map(toDomainNote);
  }

  async createNote(note: CreateNoteRecord): Promise<Note> {
    const db = getMainDatabase();

    db.prepare(
      `
        INSERT INTO notes (id, title, body, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `,
    ).run(note.id, note.title, note.body, note.createdAt, note.updatedAt);

    return note;
  }

  async deleteNote(id: string): Promise<void> {
    const db = getMainDatabase();
    db.prepare('DELETE FROM notes WHERE id = ?').run(id);
  }
}

type NoteRow = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
};

function toDomainNote(row: NoteRow): Note {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
