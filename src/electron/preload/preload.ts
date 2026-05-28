import { contextBridge } from 'electron';
import type { DesktopApi } from '@/contracts/ipc/shared/desktop-api';
import { agentRunsBridge } from './bridge/agent-runs-bridge';
import { agentRuntimeBridge } from './bridge/agent-runtime-bridge';
import { appInfoBridge } from './bridge/app-info-bridge';
import { notesBridge } from './bridge/notes-bridge';
import { workspacesBridge } from './bridge/workspaces-bridge';

const desktopApi: DesktopApi = {
  appInfo: appInfoBridge,
  workspaces: workspacesBridge,
  agentRuns: agentRunsBridge,
  agentRuntime: agentRuntimeBridge,
  notes: notesBridge,
};

contextBridge.exposeInMainWorld('desktop', desktopApi);
