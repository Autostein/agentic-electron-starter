import { ipcMain } from 'electron';
import { getAppInfo } from '../../../application/use-cases/app-info/get-app-info';
import type { AppInfoProvider } from '../../../domain/app-info';
import {
  APP_INFO_IPC_CHANNELS,
  AppInfoResultSchema,
  type AppInfoResult,
} from '../../../infrastructure/ipc/app-info.contract';

export type AppInfoIpcDeps = {
  appInfoProvider: AppInfoProvider;
};

export function createAppInfoIpcHandlers(deps: AppInfoIpcDeps) {
  return {
    get: async (): Promise<AppInfoResult> => {
      const result = getAppInfo({ appInfoProvider: deps.appInfoProvider });
      return AppInfoResultSchema.parse(result);
    },
  };
}

export function registerAppInfoIpcHandlers(deps: AppInfoIpcDeps): void {
  const handlers = createAppInfoIpcHandlers(deps);
  ipcMain.handle(APP_INFO_IPC_CHANNELS.get, handlers.get);
}
