import type { DesktopApi } from '../../infrastructure/ipc/shared/desktop-api';

declare global {
  interface Window {
    desktop: DesktopApi;
  }
}

export {};
