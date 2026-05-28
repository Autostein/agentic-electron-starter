import { formatErrorMessage } from '@/shared/app-errors';

export function formatRendererError(error: unknown): string {
  return formatErrorMessage(error);
}
