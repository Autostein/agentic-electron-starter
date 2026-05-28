import { AppError } from '@/shared/app-errors';

export class AgentRunDomainError extends AppError {
  constructor(message: string, options: { details?: unknown } = {}) {
    super('VALIDATION_FAILED', message, options);
    this.name = 'AgentRunDomainError';
  }
}
