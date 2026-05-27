import { z } from 'zod';

export const APP_INFO_IPC_CHANNELS = {
  get: 'app-info:get',
} as const;

export const AppInfoResultSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  platform: z.string().min(1),
  isPackaged: z.boolean(),
});

export type AppInfoResult = z.infer<typeof AppInfoResultSchema>;
