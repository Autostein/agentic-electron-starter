import type { DesktopApi } from '@/contracts/ipc/shared/desktop-api';

declare global {
  interface Window {
    desktop: DesktopApi;
  }
}

export {};
