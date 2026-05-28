import { normalizeAgentPrompt } from '../value-objects/agent-prompt';
import { normalizeAgentRunId } from '../value-objects/agent-run-id';

const AGENT_RUN_BRANCH_PREFIX = 'agentic';
const MAX_PROMPT_SLUG_LENGTH = 36;

export type CreateAgentRunBranchNameInput = {
  runId: string;
  prompt: string;
};

export function createAgentRunBranchName(input: CreateAgentRunBranchNameInput): string {
  const runId = normalizeAgentRunId(input.runId);
  const prompt = normalizeAgentPrompt(input.prompt);
  const slug = toPromptSlug(prompt);

  return `${AGENT_RUN_BRANCH_PREFIX}/${runId.slice(0, 8)}-${slug}`;
}

function toPromptSlug(prompt: string): string {
  return prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_PROMPT_SLUG_LENGTH)
    .replace(/^-+|-+$/g, '') || 'run';
}
