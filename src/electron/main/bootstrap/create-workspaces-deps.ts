import { LocalGitRepositoryInspector } from '@/infrastructure/main/git/git-repository-inspector';
import { SQLiteWorkspaceRepository } from '@/infrastructure/main/persistence/sqlite-workspace-repository';

export function createWorkspacesDeps() {
  return {
    gitRepositoryInspector: new LocalGitRepositoryInspector(),
    workspaceRepository: new SQLiteWorkspaceRepository(),
  };
}

export type WorkspacesDeps = ReturnType<typeof createWorkspacesDeps>;
