import type { Note, NoteRepository } from '../../domain';

export async function listNotes(deps: {
  noteRepository: NoteRepository;
}): Promise<Note[]> {
  return deps.noteRepository.listNotes();
}
