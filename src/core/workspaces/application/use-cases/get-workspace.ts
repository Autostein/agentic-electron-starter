import type { WorkspaceDetail, WorkspaceRepository } from '../../domain';

export function getWorkspace(
  id: string,
  deps: { workspaceRepository: WorkspaceRepository },
): Promise<WorkspaceDetail | null> {
  return deps.workspaceRepository.getWorkspaceDetail(id);
}
