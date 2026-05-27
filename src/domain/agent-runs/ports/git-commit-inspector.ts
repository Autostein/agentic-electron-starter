import type { AgentRunCommit } from '../entities/agent-run';

export type GetCommitSummaryInput = {
  repoPath: string;
  commit: AgentRunCommit;
};

export type GetCommitDetailInput = {
  repoPath: string;
  runId: string;
  sha: string;
  largeFileLineThreshold: number;
};

export type GetCommitFileDiffInput = {
  repoPath: string;
  sha: string;
  path: string;
};
