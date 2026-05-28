import { describe, expect, it } from 'vitest';
import {
  AppError,
  createAppErrorFromDto,
  formatErrorMessage,
  isAppErrorDto,
  toAppErrorDto,
} from './app-errors';

describe('app errors', () => {
  it('round-trips app errors through DTOs', () => {
    const error = new AppError('NOT_FOUND', 'Missing run.', {
      details: { id: 'run-1' },
    });

    expect(error.toDto()).toEqual({
      code: 'NOT_FOUND',
      message: 'Missing run.',
      details: { id: 'run-1' },
    });
    expect(createAppErrorFromDto(error.toDto())).toMatchObject({
      code: 'NOT_FOUND',
      message: 'Missing run.',
      details: { id: 'run-1' },
    });
  });

  it('detects app error DTOs', () => {
    expect(isAppErrorDto({ code: 'AUTH_MISSING', message: 'Missing auth.' })).toBe(true);
    expect(isAppErrorDto({ code: 'BAD', message: 'Missing auth.' })).toBe(false);
  });

  it('maps unknown values to safe DTOs', () => {
    expect(toAppErrorDto(new Error('low-level path /tmp/secret'))).toEqual({
      code: 'UNKNOWN',
      message: 'Unexpected application error.',
    });
  });

  it('formats error messages for UI display', () => {
    expect(formatErrorMessage(new AppError('IMAGE_MISSING', 'Build it first.'))).toBe(
      'Build it first.',
    );
    expect(formatErrorMessage({ code: 'WORKSPACE_INVALID', message: 'Not a repo.' })).toBe(
      'Not a repo.',
    );
    expect(formatErrorMessage('plain failure')).toBe('plain failure');
  });
});
