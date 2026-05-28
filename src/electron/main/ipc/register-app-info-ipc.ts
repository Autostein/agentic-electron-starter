import { getAppInfo } from '@/core/app-info/application/use-cases/get-app-info';
import type { AppInfoProvider } from '@/core/app-info/domain';
import {
  APP_INFO_IPC_CHANNELS,
  AppInfoResultSchema,
  type AppInfoResult,
} from '@/contracts/ipc/app-info.contract';
import { registerIpcHandler } from './ipc-handler-wrapper';

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
  registerIpcHandler(APP_INFO_IPC_CHANNELS.get, handlers.get);
}
