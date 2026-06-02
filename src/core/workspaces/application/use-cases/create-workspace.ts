import type { Workspace, WorkspaceRepository } from '../../domain';
import { AppError } from '@/shared/app-errors';

export type CreateWorkspaceCommand = {
  name: string;
};

export async function createWorkspace(
  command: CreateWorkspaceCommand,
  deps: {
    createId: () => string;
    workspaceRepository: WorkspaceRepository;
    now: () => number;
  },
): Promise<Workspace> {
  const name = command.name.trim();

  if (!name) {
    throw new AppError('VALIDATION_FAILED', 'Workspace name is required.');
  }

  const now = deps.now();
  return deps.workspaceRepository.createWorkspace(
    { id: deps.createId(), name },
    { createdAt: now, updatedAt: now },
  );
}
