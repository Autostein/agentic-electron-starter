import type { DesktopApi } from '@/contracts/ipc/shared/desktop-api';
import {
  WORKSPACES_IPC_CHANNELS,
  type WorkspaceDetailResult,
  type WorkspaceFolderResult,
  type WorkspaceSummaryResult,
} from '@/contracts/ipc/workspaces.contract';
import { invokeIpc } from './invoke-ipc';

export const workspacesBridge: DesktopApi['workspaces'] = {
  create: (input) => invokeIpc<WorkspaceDetailResult>(WORKSPACES_IPC_CHANNELS.create, input),
  update: (input) => invokeIpc<WorkspaceDetailResult>(WORKSPACES_IPC_CHANNELS.update, input),
  list: () => invokeIpc<WorkspaceSummaryResult[]>(WORKSPACES_IPC_CHANNELS.list),
  get: (input) => invokeIpc<WorkspaceDetailResult>(WORKSPACES_IPC_CHANNELS.get, input),
  pickFolder: (input) => invokeIpc<WorkspaceFolderResult | null>(
    WORKSPACES_IPC_CHANNELS.pickFolder,
    input,
  ),
  updateFolder: (input) => invokeIpc<WorkspaceFolderResult>(
    WORKSPACES_IPC_CHANNELS.updateFolder,
    input,
  ),
  removeFolder: (input) => invokeIpc<void>(WORKSPACES_IPC_CHANNELS.removeFolder, input),
};
