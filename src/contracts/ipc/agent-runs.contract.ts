import { z } from 'zod';

export const AGENT_RUNS_IPC_CHANNELS = {
  start: 'agent-runs:start',
  list: 'agent-runs:list',
  get: 'agent-runs:get',
  getCommitDetails: 'agent-runs:get-commit-details',
  getCommitFileDiff: 'agent-runs:get-commit-file-diff',
  cancel: 'agent-runs:cancel',
  event: 'agent-runs:event',
} as const;

export const AgentProviderSchema = z.enum(['claude-code', 'codex']);
export const AgentRunStatusSchema = z.enum([
  'queued',
  'running',
  'succeeded',
  'failed',
  'cancelled',
]);
export const AgentRunEventTypeSchema = z.enum(['status', 'log', 'tool', 'commit', 'error']);

export const StartAgentRunInputSchema = z.object({
  workspaceId: z.string().min(1),
  targetFolderId: z.string().min(1),
  runtimeProfileId: z.string().min(1),
  provider: AgentProviderSchema,
  model: z.string().min(1),
  prompt: z.string().min(1),
  maxIterations: z.number().int().min(1).max(20).optional(),
});

export const ListAgentRunsInputSchema = z.object({
  workspaceId: z.string().min(1).optional(),
}).optional();

export const GetAgentRunInputSchema = z.object({
  id: z.string().min(1),
});

export const CancelAgentRunInputSchema = z.object({
  id: z.string().min(1),
});

export const WatchAgentRunInputSchema = z.object({
  runId: z.string().min(1),
});

export const GetAgentRunCommitDetailsInputSchema = z.object({
  runId: z.string().min(1),
  sha: z.string().min(1),
});

export const GetAgentRunCommitFileDiffInputSchema = z.object({
  runId: z.string().min(1),
  sha: z.string().min(1),
  path: z.string().min(1),
});

export const AgentRunResultSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  workspaceName: z.string(),
  targetFolderId: z.string(),
  targetFolderPath: z.string(),
  targetFolderLabel: z.string(),
  runtimeProfileId: z.string(),
  runtimeProfileName: z.string(),
  runtimeImageName: z.string(),
  provider: AgentProviderSchema,
  model: z.string(),
  prompt: z.string(),
  maxIterations: z.number(),
  status: AgentRunStatusSchema,
  branchName: z.string(),
  logFilePath: z.string(),
  createdAt: z.number(),
  startedAt: z.number().nullable(),
  finishedAt: z.number().nullable(),
  errorMessage: z.string().nullable(),
});

export const AgentRunEventSchema = z.object({
  id: z.string(),
  runId: z.string(),
  type: AgentRunEventTypeSchema,
  message: z.string(),
  createdAt: z.number(),
});

export const AgentRunCommitSchema = z.object({
  runId: z.string(),
  sha: z.string(),
  shortSha: z.string(),
  subject: z.string().nullable(),
  createdAt: z.number(),
  filesChanged: z.number().nullable(),
  additions: z.number().nullable(),
  deletions: z.number().nullable(),
  unavailable: z.boolean(),
});

export const AgentRunDiffLineSchema = z.object({
  type: z.enum(['context', 'addition', 'deletion']),
  content: z.string(),
  oldLineNumber: z.number().nullable(),
  newLineNumber: z.number().nullable(),
});

export const AgentRunDiffHunkSchema = z.object({
  header: z.string(),
  lines: z.array(AgentRunDiffLineSchema),
});

export const AgentRunCommitFileDiffSchema = z.object({
  oldPath: z.string().nullable(),
  newPath: z.string().nullable(),
  status: z.enum(['added', 'modified', 'deleted', 'renamed', 'copied', 'binary']),
  additions: z.number(),
  deletions: z.number(),
  isLarge: z.boolean(),
  hunks: z.array(AgentRunDiffHunkSchema),
});

export const AgentRunCommitDetailSchema = z.object({
  runId: z.string(),
  sha: z.string(),
  shortSha: z.string(),
  subject: z.string(),
  authorName: z.string(),
  authorEmail: z.string(),
  committedAt: z.number(),
  filesChanged: z.number(),
  additions: z.number(),
  deletions: z.number(),
  files: z.array(AgentRunCommitFileDiffSchema),
});

export const AgentRunDetailSchema = z.object({
  run: AgentRunResultSchema,
  events: z.array(AgentRunEventSchema),
  commits: z.array(AgentRunCommitSchema),
});

export const AgentRunListResultSchema = z.array(AgentRunResultSchema);

export type AgentProviderResult = z.infer<typeof AgentProviderSchema>;
export type StartAgentRunInput = z.infer<typeof StartAgentRunInputSchema>;
export type ListAgentRunsInput = z.infer<typeof ListAgentRunsInputSchema>;
export type GetAgentRunInput = z.infer<typeof GetAgentRunInputSchema>;
export type CancelAgentRunInput = z.infer<typeof CancelAgentRunInputSchema>;
export type WatchAgentRunInput = z.infer<typeof WatchAgentRunInputSchema>;
export type GetAgentRunCommitDetailsInput = z.infer<typeof GetAgentRunCommitDetailsInputSchema>;
export type GetAgentRunCommitFileDiffInput = z.infer<typeof GetAgentRunCommitFileDiffInputSchema>;
export type AgentRunResult = z.infer<typeof AgentRunResultSchema>;
export type AgentRunEventResult = z.infer<typeof AgentRunEventSchema>;
export type AgentRunCommitResult = z.infer<typeof AgentRunCommitSchema>;
export type AgentRunDiffLineResult = z.infer<typeof AgentRunDiffLineSchema>;
export type AgentRunDiffHunkResult = z.infer<typeof AgentRunDiffHunkSchema>;
export type AgentRunCommitDetail = z.infer<typeof AgentRunCommitDetailSchema>;
export type AgentRunCommitFileDiff = z.infer<typeof AgentRunCommitFileDiffSchema>;
export type AgentRunDetailResult = z.infer<typeof AgentRunDetailSchema>;
