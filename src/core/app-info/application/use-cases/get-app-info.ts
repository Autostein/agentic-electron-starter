import type { AppInfo, AppInfoProvider } from '../../domain';

export function getAppInfo(deps: {
  appInfoProvider: AppInfoProvider;
}): AppInfo {
  return deps.appInfoProvider.getAppInfo();
}
