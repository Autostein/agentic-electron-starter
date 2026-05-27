import type { Note, NoteRepository } from '../../domain';

export type CreateNoteCommand = {
  title: string;
  body?: string;
};

export async function createNote(
  command: CreateNoteCommand,
  deps: {
    createId: () => string;
    noteRepository: NoteRepository;
    now: () => number;
  },
): Promise<Note> {
  const title = command.title.trim();
  if (!title) {
    throw new Error('Missing note title.');
  }

  const now = deps.now();
  return deps.noteRepository.createNote({
    id: deps.createId(),
    title,
    body: command.body?.trim() ?? '',
    createdAt: now,
    updatedAt: now,
  });
}
