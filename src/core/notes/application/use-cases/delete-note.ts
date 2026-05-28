import type { NoteRepository } from '../../domain';
import { AppError } from '@/shared/app-errors';

export async function deleteNote(
  id: string,
  deps: {
    noteRepository: NoteRepository;
  },
): Promise<void> {
  const normalizedId = id.trim();
  if (!normalizedId) {
    throw new AppError('VALIDATION_FAILED', 'Missing note id.');
  }

  await deps.noteRepository.deleteNote(normalizedId);
}
