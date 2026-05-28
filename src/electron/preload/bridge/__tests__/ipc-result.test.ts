import { describe, expect, it } from 'vitest';
import { AppError } from '@/shared/app-errors';
import { unwrapIpcResult } from '../ipc-result';

describe('preload IPC result unwrap', () => {
  it('returns successful data', () => {
    expect(unwrapIpcResult<{ id: string }>({
      ok: true,
      data: { id: 'run-1' },
    })).toEqual({ id: 'run-1' });
  });

  it('throws AppError for failed envelopes', () => {
    expect(() => unwrapIpcResult({
      ok: false,
      error: {
        code: 'AUTH_MISSING',
        message: 'Missing CLI auth.',
      },
    })).toThrow(AppError);
  });

  it('rejects malformed envelopes', () => {
    expect(() => unwrapIpcResult({ ok: false, error: { code: 'BAD' } })).toThrow();
  });
});
