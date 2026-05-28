import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { AppError } from '@/shared/app-errors';
import { toIpcResultHandler } from '../ipc-handler-wrapper';

describe('IPC handler wrapper', () => {
  it('wraps successful results in an envelope', async () => {
    const handler = toIpcResultHandler(async () => ({ id: 'run-1' }));

    await expect(handler()).resolves.toEqual({
      ok: true,
      data: { id: 'run-1' },
    });
  });

  it('preserves AppError codes', async () => {
    const handler = toIpcResultHandler(async () => {
      throw new AppError('NOT_FOUND', 'Agent run not found.');
    });

    await expect(handler()).resolves.toEqual({
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Agent run not found.',
      },
    });
  });

  it('maps Zod errors to validation failures', async () => {
    const handler = toIpcResultHandler(async () => {
      z.object({ provider: z.literal('codex') }).parse({ provider: 'bad' });
    });

    const result = await handler();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_FAILED');
      expect(result.error.message).toBe('Invalid IPC payload.');
      expect(result.error.details).toEqual({
        issues: expect.arrayContaining([
          expect.objectContaining({ path: 'provider' }),
        ]),
      });
    }
  });

  it('maps unknown errors to safe unknown failures', async () => {
    const handler = toIpcResultHandler(async () => {
      throw new Error('filesystem path /private/secret');
    });

    await expect(handler()).resolves.toEqual({
      ok: false,
      error: {
        code: 'UNKNOWN',
        message: 'Unexpected application error.',
      },
    });
  });
});
