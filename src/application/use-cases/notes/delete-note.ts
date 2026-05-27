import type { NoteRepository } from '../../../domain/notes';

export async function deleteNote(
  id: string,
  deps: {
    noteRepository: NoteRepository;
  },
): Promise<void> {
  const normalizedId = id.trim();
  if (!normalizedId) {
    throw new Error('Missing note id.');
  }

  await deps.noteRepository.deleteNote(normalizedId);
}
