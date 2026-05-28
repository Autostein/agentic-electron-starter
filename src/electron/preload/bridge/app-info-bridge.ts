import { APP_INFO_IPC_CHANNELS, type AppInfoResult } from '@/contracts/ipc/app-info.contract';
import type { DesktopApi } from '@/contracts/ipc/shared/desktop-api';
import { invokeIpc } from './invoke-ipc';

export const appInfoBridge: DesktopApi['appInfo'] = {
  get: () => invokeIpc<AppInfoResult>(APP_INFO_IPC_CHANNELS.get),
};
