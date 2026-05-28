export const APP_ERROR_CODES = [
  'NOT_FOUND',
  'VALIDATION_FAILED',
  'CONFLICT',
  'PERMISSION_DENIED',
  'OPERATION_ALREADY_ACTIVE',
  'BUILD_ALREADY_ACTIVE',
  'DOCKER_UNAVAILABLE',
  'IMAGE_MISSING',
  'AUTH_MISSING',
  'WORKSPACE_INVALID',
  'EXTERNAL_PROCESS_FAILED',
  'UNKNOWN',
] as const;

export type AppErrorCode = typeof APP_ERROR_CODES[number];

export type AppErrorDto = {
  code: AppErrorCode;
  message: string;
  details?: unknown;
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly details?: unknown;

  constructor(code: AppErrorCode, message: string, options: { details?: unknown } = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = options.details;
  }

  toDto(): AppErrorDto {
    return this.details === undefined
      ? { code: this.code, message: this.message }
      : { code: this.code, message: this.message, details: this.details };
  }
}

export function createAppErrorFromDto(dto: AppErrorDto): AppError {
  return new AppError(dto.code, dto.message, { details: dto.details });
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isAppErrorCode(value: unknown): value is AppErrorCode {
  return typeof value === 'string' && APP_ERROR_CODES.includes(value as AppErrorCode);
}

export function isAppErrorDto(value: unknown): value is AppErrorDto {
  return isRecord(value)
    && isAppErrorCode(value.code)
    && typeof value.message === 'string';
}

export function toAppErrorDto(error: unknown): AppErrorDto {
  if (isAppError(error)) {
    return error.toDto();
  }

  if (isAppErrorDto(error)) {
    return error;
  }

  return {
    code: 'UNKNOWN',
    message: 'Unexpected application error.',
  };
}

export function formatErrorMessage(error: unknown, fallback = 'Unknown error'): string {
  if (isAppError(error)) {
    return error.message;
  }

  if (isAppErrorDto(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return typeof error === 'string' ? error : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
