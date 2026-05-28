import { listWorkspaces } from '@/core/workspaces/application/use-cases/list-workspaces';
import { registerWorkspace } from '@/core/workspaces/application/use-cases/register-workspace';
import type { GitRepositoryInspector, WorkspaceRepository } from '@/core/workspaces/domain';
import {
  WORKSPACES_IPC_CHANNELS,
  WorkspaceResultSchema,
  WorkspacesListResultSchema,
  type WorkspaceResult,
} from '@/contracts/ipc/workspaces.contract';
import { registerIpcHandler } from './ipc-handler-wrapper';

export type WorkspacesIpcDeps = {
  gitRepositoryInspector: GitRepositoryInspector;
  workspaceRepository: WorkspaceRepository;
  pickDirectory: () => Promise<string | null>;
  now: () => number;
};

export function createWorkspacesIpcHandlers(deps: WorkspacesIpcDeps) {
  return {
    list: async (): Promise<WorkspaceResult[]> => {
      const workspaces = await listWorkspaces({ workspaceRepository: deps.workspaceRepository });
      return WorkspacesListResultSchema.parse(workspaces);
    },
    pick: async (): Promise<WorkspaceResult | null> => {
      const directory = await deps.pickDirectory();

      if (!directory) {
        return null;
      }

      const workspace = await registerWorkspace(directory, {
        gitRepositoryInspector: deps.gitRepositoryInspector,
        workspaceRepository: deps.workspaceRepository,
        now: deps.now,
      });

      return WorkspaceResultSchema.parse(workspace);
    },
  };
}

export function registerWorkspacesIpcHandlers(deps: WorkspacesIpcDeps): void {
  const handlers = createWorkspacesIpcHandlers(deps);
  registerIpcHandler(WORKSPACES_IPC_CHANNELS.list, handlers.list);
  registerIpcHandler(WORKSPACES_IPC_CHANNELS.pick, handlers.pick);
}
