import type {
  CancelAgentRunInput,
  GetAgentRunCommitDetailsInput,
  GetAgentRunCommitFileDiffInput,
  GetAgentRunInput,
  ListAgentRunsInput,
  StartAgentRunInput,
  WatchAgentRunInput,
} from '@/contracts/ipc/agent-runs.contract';

export function startAgentRun(input: StartAgentRunInput) {
  return window.desktop.agentRuns.start(input);
}

export function listAgentRuns(input?: ListAgentRunsInput) {
  return window.desktop.agentRuns.list(input);
}

export function getAgentRun(input: GetAgentRunInput) {
  return window.desktop.agentRuns.get(input);
}

export function getAgentRunCommitDetails(input: GetAgentRunCommitDetailsInput) {
  return window.desktop.agentRuns.getCommitDetails(input);
}

export function getAgentRunCommitFileDiff(input: GetAgentRunCommitFileDiffInput) {
  return window.desktop.agentRuns.getCommitFileDiff(input);
}

export function cancelAgentRun(input: CancelAgentRunInput) {
  return window.desktop.agentRuns.cancel(input);
}

export function onAgentRunEvent(
  input: WatchAgentRunInput,
  callback: Parameters<typeof window.desktop.agentRuns.onEvent>[1],
) {
  return window.desktop.agentRuns.onEvent(input, callback);
}
