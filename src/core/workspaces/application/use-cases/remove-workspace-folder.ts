import type { AgentRunRepository } from '@/core/agent-runs/domain';
import type { WorkspaceRepository } from '../../domain';
import { AppError } from '@/shared/app-errors';

export async function removeWorkspaceFolder(
  id: string,
  deps: {
    agentRunRepository: Pick<AgentRunRepository, 'hasActiveRunForTargetFolder'>;
    workspaceRepository: WorkspaceRepository;
  },
): Promise<void> {
  const folder = await deps.workspaceRepository.getFolder(id);

  if (!folder) {
    throw new AppError('NOT_FOUND', 'Workspace folder not found.');
  }

  if (await deps.agentRunRepository.hasActiveRunForTargetFolder(id)) {
    throw new AppError('CONFLICT', 'Folder has an active agent run.');
  }

  await deps.workspaceRepository.removeFolder(id);
}
