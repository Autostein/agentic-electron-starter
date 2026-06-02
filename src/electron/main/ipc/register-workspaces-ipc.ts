import { randomUUID } from 'node:crypto';
import type { AgentRunRepository } from '@/core/agent-runs/domain';
import { addWorkspaceFolder } from '@/core/workspaces/application/use-cases/add-workspace-folder';
import { createWorkspace } from '@/core/workspaces/application/use-cases/create-workspace';
import { getWorkspace } from '@/core/workspaces/application/use-cases/get-workspace';
import { listWorkspaces } from '@/core/workspaces/application/use-cases/list-workspaces';
import { removeWorkspaceFolder } from '@/core/workspaces/application/use-cases/remove-workspace-folder';
import { updateWorkspace } from '@/core/workspaces/application/use-cases/update-workspace';
import { updateWorkspaceFolder } from '@/core/workspaces/application/use-cases/update-workspace-folder';
import type { GitRepositoryInspector, WorkspaceRepository } from '@/core/workspaces/domain';
import {
  CreateWorkspaceInputSchema,
  GetWorkspaceInputSchema,
  PickWorkspaceFolderInputSchema,
  RemoveWorkspaceFolderInputSchema,
  UpdateWorkspaceFolderInputSchema,
  UpdateWorkspaceInputSchema,
  WORKSPACES_IPC_CHANNELS,
  WorkspaceDetailResultSchema,
  WorkspaceFolderResultSchema,
  WorkspacesListResultSchema,
  type WorkspaceDetailResult,
  type WorkspaceFolderResult,
  type WorkspaceSummaryResult,
} from '@/contracts/ipc/workspaces.contract';
import { AppError } from '@/shared/app-errors';
import { registerIpcHandler } from './ipc-handler-wrapper';

export type WorkspacesIpcDeps = {
  agentRunRepository: AgentRunRepository;
  gitRepositoryInspector: GitRepositoryInspector;
  workspaceRepository: WorkspaceRepository;
  pickDirectory: () => Promise<string | null>;
  now: () => number;
};

export function createWorkspacesIpcHandlers(deps: WorkspacesIpcDeps) {
  return {
    create: async (_event: unknown, payload: unknown): Promise<WorkspaceDetailResult> => {
      const input = CreateWorkspaceInputSchema.parse(payload);
      const workspace = await createWorkspace(input, {
        createId: randomUUID,
        workspaceRepository: deps.workspaceRepository,
        now: deps.now,
      });

      return WorkspaceDetailResultSchema.parse({ ...workspace, folders: [] });
    },
    update: async (_event: unknown, payload: unknown): Promise<WorkspaceDetailResult> => {
      const input = UpdateWorkspaceInputSchema.parse(payload);
      await updateWorkspace(input, {
        workspaceRepository: deps.workspaceRepository,
        now: deps.now,
      });
      const workspace = await getWorkspace(input.id, {
        workspaceRepository: deps.workspaceRepository,
      });

      if (!workspace) {
        throw new AppError('NOT_FOUND', 'Workspace not found.');
      }

      return WorkspaceDetailResultSchema.parse(workspace);
    },
    list: async (): Promise<WorkspaceSummaryResult[]> => {
      const workspaces = await listWorkspaces({ workspaceRepository: deps.workspaceRepository });
      return WorkspacesListResultSchema.parse(workspaces);
    },
    get: async (_event: unknown, payload: unknown): Promise<WorkspaceDetailResult> => {
      const input = GetWorkspaceInputSchema.parse(payload);
      const workspace = await getWorkspace(input.id, {
        workspaceRepository: deps.workspaceRepository,
      });

      if (!workspace) {
        throw new AppError('NOT_FOUND', 'Workspace not found.');
      }

      return WorkspaceDetailResultSchema.parse(workspace);
    },
    pickFolder: async (_event: unknown, payload: unknown): Promise<WorkspaceFolderResult | null> => {
      const input = PickWorkspaceFolderInputSchema.parse(payload);
      const directory = await deps.pickDirectory();

      if (!directory) {
        return null;
      }

      const folder = await addWorkspaceFolder(
        { workspaceId: input.workspaceId, path: directory },
        {
          createId: randomUUID,
          gitRepositoryInspector: deps.gitRepositoryInspector,
          workspaceRepository: deps.workspaceRepository,
          now: deps.now,
        },
      );

      return WorkspaceFolderResultSchema.parse(folder);
    },
    updateFolder: async (_event: unknown, payload: unknown): Promise<WorkspaceFolderResult> => {
      const input = UpdateWorkspaceFolderInputSchema.parse(payload);
      const folder = await updateWorkspaceFolder(input, {
        workspaceRepository: deps.workspaceRepository,
        now: deps.now,
      });

      return WorkspaceFolderResultSchema.parse(folder);
    },
    removeFolder: async (_event: unknown, payload: unknown): Promise<void> => {
      const input = RemoveWorkspaceFolderInputSchema.parse(payload);
      await removeWorkspaceFolder(input.id, {
        agentRunRepository: deps.agentRunRepository,
        workspaceRepository: deps.workspaceRepository,
      });
    },
  };
}

export function registerWorkspacesIpcHandlers(deps: WorkspacesIpcDeps): void {
  const handlers = createWorkspacesIpcHandlers(deps);
  registerIpcHandler(WORKSPACES_IPC_CHANNELS.create, handlers.create);
  registerIpcHandler(WORKSPACES_IPC_CHANNELS.update, handlers.update);
  registerIpcHandler(WORKSPACES_IPC_CHANNELS.list, handlers.list);
  registerIpcHandler(WORKSPACES_IPC_CHANNELS.get, handlers.get);
  registerIpcHandler(WORKSPACES_IPC_CHANNELS.pickFolder, handlers.pickFolder);
  registerIpcHandler(WORKSPACES_IPC_CHANNELS.updateFolder, handlers.updateFolder);
  registerIpcHandler(WORKSPACES_IPC_CHANNELS.removeFolder, handlers.removeFolder);
}
