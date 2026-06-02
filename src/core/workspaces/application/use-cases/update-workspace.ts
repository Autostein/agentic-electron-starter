import type { Workspace, WorkspaceRepository } from '../../domain';
import { AppError } from '@/shared/app-errors';

export type UpdateWorkspaceCommand = {
  id: string;
  name: string;
};

export async function updateWorkspace(
  command: UpdateWorkspaceCommand,
  deps: {
    workspaceRepository: WorkspaceRepository;
    now: () => number;
  },
): Promise<Workspace> {
  const workspace = await deps.workspaceRepository.getWorkspace(command.id);

  if (!workspace) {
    throw new AppError('NOT_FOUND', 'Workspace not found.');
  }

  const name = command.name.trim();

  if (!name) {
    throw new AppError('VALIDATION_FAILED', 'Workspace name is required.');
  }

  return deps.workspaceRepository.updateWorkspace(workspace.id, { name }, deps.now());
}
