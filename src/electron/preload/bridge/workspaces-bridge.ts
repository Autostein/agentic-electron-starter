import type { DesktopApi } from '@/contracts/ipc/shared/desktop-api';
import {
  WORKSPACES_IPC_CHANNELS,
  type WorkspaceResult,
} from '@/contracts/ipc/workspaces.contract';
import { invokeIpc } from './invoke-ipc';

export const workspacesBridge: DesktopApi['workspaces'] = {
  pick: () => invokeIpc<WorkspaceResult | null>(WORKSPACES_IPC_CHANNELS.pick),
  list: () => invokeIpc<WorkspaceResult[]>(WORKSPACES_IPC_CHANNELS.list),
};
