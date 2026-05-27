export type AppInfo = {
  name: string;
  version: string;
  platform: string;
  isPackaged: boolean;
};

export interface AppInfoProvider {
  getAppInfo(): AppInfo;
}
