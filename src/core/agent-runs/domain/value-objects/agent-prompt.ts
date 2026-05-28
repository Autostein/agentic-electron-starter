import { AgentRunDomainError } from '../errors/agent-run-errors';

export type AgentPrompt = string & { readonly __agentPromptBrand: 'AgentPrompt' };

export function normalizeAgentPrompt(value: string): AgentPrompt {
  const prompt = value.trim();

  if (!prompt) {
    throw new AgentRunDomainError('Agent prompt is required.');
  }

  return prompt as AgentPrompt;
}
