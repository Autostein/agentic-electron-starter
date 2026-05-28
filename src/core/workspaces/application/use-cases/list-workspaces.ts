import type { Workspace, WorkspaceRepository } from '../../domain';

export type ListWorkspacesDeps = {
  workspaceRepository: WorkspaceRepository;
};

export function listWorkspaces(deps: ListWorkspacesDeps): Promise<Workspace[]> {
  return deps.workspaceRepository.listWorkspaces();
}
