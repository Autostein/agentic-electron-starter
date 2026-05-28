import { ipcMain } from 'electron';
import { ZodError } from 'zod';
import type { IpcResultDto } from '@/contracts/ipc/shared/ipc-result';
import { AppError, type AppErrorDto, toAppErrorDto } from '@/shared/app-errors';

type IpcHandler<T> = (...args: unknown[]) => T | Promise<T>;

export function toIpcResultHandler<T>(handler: IpcHandler<T>) {
  return async (...args: unknown[]): Promise<IpcResultDto<Awaited<T>>> => {
    try {
      const data = await handler(...args);
      return {
        ok: true,
        data: data as Awaited<T>,
      };
    } catch (error: unknown) {
      return {
        ok: false,
        error: toIpcErrorDto(error),
      };
    }
  };
}

export function registerIpcHandler<T>(channel: string, handler: IpcHandler<T>): void {
  ipcMain.handle(channel, toIpcResultHandler(handler));
}

export function toIpcErrorDto(error: unknown): AppErrorDto {
  if (error instanceof ZodError) {
    return new AppError('VALIDATION_FAILED', 'Invalid IPC payload.', {
      details: {
        issues: error.issues.map((issue) => ({
          code: issue.code,
          message: issue.message,
          path: issue.path.join('.'),
        })),
      },
    }).toDto();
  }

  return toAppErrorDto(error);
}
