import type { WorkspaceRepository, WorkspaceSummary } from '../../domain';

export type ListWorkspacesDeps = {
  workspaceRepository: WorkspaceRepository;
};

export function listWorkspaces(deps: ListWorkspacesDeps): Promise<WorkspaceSummary[]> {
  return deps.workspaceRepository.listWorkspaces();
}
