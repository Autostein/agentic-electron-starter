import { z } from 'zod';
import { createIpcResultDtoSchema } from '@/contracts/ipc/shared/ipc-result';
import { createAppErrorFromDto } from '@/shared/app-errors';

const UnknownIpcResultSchema = createIpcResultDtoSchema(z.unknown());

export function unwrapIpcResult<T>(value: unknown): T {
  const result = UnknownIpcResultSchema.parse(value);

  if (!result.ok) {
    throw createAppErrorFromDto(result.error);
  }

  return result.data as T;
}
