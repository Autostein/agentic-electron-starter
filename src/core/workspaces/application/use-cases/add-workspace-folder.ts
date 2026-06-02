import type {
  GitRepositoryInspector,
  WorkspaceFolder,
  WorkspaceRepository,
} from '../../domain';
import { AppError } from '@/shared/app-errors';

export type AddWorkspaceFolderCommand = {
  workspaceId: string;
  path: string;
};

export async function addWorkspaceFolder(
  command: AddWorkspaceFolderCommand,
  deps: {
    createId: () => string;
    gitRepositoryInspector: GitRepositoryInspector;
    workspaceRepository: WorkspaceRepository;
    now: () => number;
  },
): Promise<WorkspaceFolder> {
  const workspace = await deps.workspaceRepository.getWorkspace(command.workspaceId);

  if (!workspace) {
    throw new AppError('NOT_FOUND', 'Workspace not found.');
  }

  const info = await deps.gitRepositoryInspector.inspect(command.path);
  const folders = await deps.workspaceRepository.listFolders(command.workspaceId);

  if (folders.some((folder) => folder.path === info.path)) {
    throw new AppError('CONFLICT', 'Folder is already attached to this workspace.');
  }

  const label = createAvailableFolderLabel(info.name, folders.map((folder) => folder.label));
  const now = deps.now();

  return deps.workspaceRepository.addFolder(
    {
      id: deps.createId(),
      workspaceId: workspace.id,
      label,
      path: info.path,
      currentBranch: info.currentBranch,
    },
    { createdAt: now, updatedAt: now },
  );
}

function createAvailableFolderLabel(baseName: string, existingLabels: string[]): string {
  const normalizedExisting = new Set(existingLabels.map(normalizeLabel));
  const baseLabel = baseName.trim() || 'Folder';

  if (!normalizedExisting.has(normalizeLabel(baseLabel))) {
    return baseLabel;
  }

  for (let index = 2; index < 1000; index += 1) {
    const candidate = `${baseLabel} ${index}`;

    if (!normalizedExisting.has(normalizeLabel(candidate))) {
      return candidate;
    }
  }

  throw new AppError('CONFLICT', 'Unable to create a unique folder label.');
}

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase();
}
