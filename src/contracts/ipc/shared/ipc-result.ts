import { z } from 'zod';
import { APP_ERROR_CODES, type AppErrorDto } from '@/shared/app-errors';

export const AppErrorCodeSchema = z.enum(APP_ERROR_CODES);

export const AppErrorDtoSchema = z.object({
  code: AppErrorCodeSchema,
  message: z.string(),
  details: z.unknown().optional(),
});

export type IpcResultDto<T> = {
  ok: true;
  data: T;
} | {
  ok: false;
  error: AppErrorDto;
};

export function createIpcResultDtoSchema<TSchema extends z.ZodType>(dataSchema: TSchema) {
  return z.discriminatedUnion('ok', [
    z.object({
      ok: z.literal(true),
      data: dataSchema,
    }),
    z.object({
      ok: z.literal(false),
      error: AppErrorDtoSchema,
    }),
  ]);
}
