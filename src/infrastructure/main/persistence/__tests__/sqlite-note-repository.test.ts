import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { closeMainDatabase, initializeMainDatabase } from '../db/client';
import { SQLiteNoteRepository } from '../sqlite-note-repository';

describe('SQLiteNoteRepository', () => {
  let userDataPath: string;
  let repository: SQLiteNoteRepository;

  beforeEach(() => {
    userDataPath = fs.mkdtempSync(path.join(os.tmpdir(), 'agentic-electron-notes-'));
    initializeMainDatabase({
      userDataPath,
      resourcesPath: process.cwd(),
      isPackaged: false,
    });
    repository = new SQLiteNoteRepository();
  });

  afterEach(() => {
    closeMainDatabase();
    fs.rmSync(userDataPath, { recursive: true, force: true });
  });

  it('creates, lists, and deletes notes', async () => {
    await expect(repository.listNotes()).resolves.toEqual([]);

    await repository.createNote({
      id: 'note-1',
      title: 'First',
      body: 'Body',
      createdAt: 100,
      updatedAt: 100,
    });
    await repository.createNote({
      id: 'note-2',
      title: 'Second',
      body: '',
      createdAt: 200,
      updatedAt: 200,
    });

    await expect(repository.listNotes()).resolves.toEqual([
      {
        id: 'note-2',
        title: 'Second',
        body: '',
        createdAt: 200,
        updatedAt: 200,
      },
      {
        id: 'note-1',
        title: 'First',
        body: 'Body',
        createdAt: 100,
        updatedAt: 100,
      },
    ]);

    await repository.deleteNote('note-2');

    await expect(repository.listNotes()).resolves.toEqual([
      {
        id: 'note-1',
        title: 'First',
        body: 'Body',
        createdAt: 100,
        updatedAt: 100,
      },
    ]);
  });
});
