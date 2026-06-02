import type { WorkspaceFolder, WorkspaceRepository } from '../../domain';
import { AppError } from '@/shared/app-errors';

export type UpdateWorkspaceFolderCommand = {
  id: string;
  label: string;
};

export async function updateWorkspaceFolder(
  command: UpdateWorkspaceFolderCommand,
  deps: {
    workspaceRepository: WorkspaceRepository;
    now: () => number;
  },
): Promise<WorkspaceFolder> {
  const folder = await deps.workspaceRepository.getFolder(command.id);

  if (!folder) {
    throw new AppError('NOT_FOUND', 'Workspace folder not found.');
  }

  const label = command.label.trim();

  if (!label) {
    throw new AppError('VALIDATION_FAILED', 'Folder label is required.');
  }

  const siblings = await deps.workspaceRepository.listFolders(folder.workspaceId);
  const normalizedLabel = normalizeLabel(label);

  if (siblings.some((sibling) => (
    sibling.id !== folder.id && normalizeLabel(sibling.label) === normalizedLabel
  ))) {
    throw new AppError('CONFLICT', 'Folder label is already used in this workspace.');
  }

  return deps.workspaceRepository.updateFolder(folder.id, { label }, deps.now());
}

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase();
}
