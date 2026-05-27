import type { AppInfo, AppInfoProvider } from '../../../domain/app-info';

export function getAppInfo(deps: {
  appInfoProvider: AppInfoProvider;
}): AppInfo {
  return deps.appInfoProvider.getAppInfo();
}
