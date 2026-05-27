import type { AgentRunCommit } from '../../../domain/agent-runs';

export type AgentRunCommitSummary = AgentRunCommit & {
  shortSha: string;
  subject: string | null;
  filesChanged: number | null;
  additions: number | null;
  deletions: number | null;
  unavailable: boolean;
};

export type AgentRunCommitFileStatus =
  | 'added'
  | 'modified'
  | 'deleted'
  | 'renamed'
  | 'copied'
  | 'binary';

export type AgentRunDiffLineType = 'context' | 'addition' | 'deletion';

export type AgentRunDiffLine = {
  type: AgentRunDiffLineType;
  content: string;
  oldLineNumber: number | null;
  newLineNumber: number | null;
};

export type AgentRunDiffHunk = {
  header: string;
  lines: AgentRunDiffLine[];
};

export type AgentRunCommitFileDiff = {
  oldPath: string | null;
  newPath: string | null;
  status: AgentRunCommitFileStatus;
  additions: number;
  deletions: number;
  isLarge: boolean;
  hunks: AgentRunDiffHunk[];
};

export type AgentRunCommitDetail = {
  runId: string;
  sha: string;
  shortSha: string;
  subject: string;
  authorName: string;
  authorEmail: string;
  committedAt: number;
  filesChanged: number;
  additions: number;
  deletions: number;
  files: AgentRunCommitFileDiff[];
};
