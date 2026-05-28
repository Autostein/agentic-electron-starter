import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const nowMs = sql`(strftime('%s', 'now') * 1000)`;

export const notes = sqliteTable(
  'notes',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    body: text('body').notNull().default(''),
    createdAt: integer('created_at').notNull().default(nowMs),
    updatedAt: integer('updated_at').notNull().default(nowMs),
  },
  (table) => [
    index('notes_updated_at_idx').on(table.updatedAt),
    index('notes_title_idx').on(table.title),
  ],
);

export const workspaces = sqliteTable(
  'workspaces',
  {
    id: text('id').primaryKey(),
    path: text('path').notNull().unique(),
    name: text('name').notNull(),
    currentBranch: text('current_branch'),
    createdAt: integer('created_at').notNull().default(nowMs),
    updatedAt: integer('updated_at').notNull().default(nowMs),
  },
  (table) => [
    index('workspaces_updated_at_idx').on(table.updatedAt),
  ],
);

export const agentRuntimeProfiles = sqliteTable('agent_runtime_profiles', {
  id: text('id').primaryKey().default('starter'),
  name: text('name').notNull(),
  sourceKind: text('source_kind').notNull(),
  profilePath: text('profile_path'),
  imageName: text('image_name').notNull(),
  claudeDefaultModel: text('claude_default_model').notNull(),
  codexDefaultModel: text('codex_default_model').notNull(),
  claudeAuthMountEnabled: integer('claude_auth_mount_enabled', { mode: 'boolean' }).notNull(),
  codexAuthMountEnabled: integer('codex_auth_mount_enabled', { mode: 'boolean' }).notNull(),
  createdAt: integer('created_at').notNull().default(nowMs),
  updatedAt: integer('updated_at').notNull().default(nowMs),
});

export const agentRuns = sqliteTable(
  'agent_runs',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id').notNull(),
    workspacePath: text('workspace_path').notNull(),
    workspaceName: text('workspace_name').notNull(),
    runtimeProfileId: text('runtime_profile_id').notNull(),
    runtimeProfileName: text('runtime_profile_name').notNull(),
    runtimeImageName: text('runtime_image_name').notNull(),
    provider: text('provider').notNull(),
    model: text('model').notNull(),
    prompt: text('prompt').notNull(),
    maxIterations: integer('max_iterations').notNull(),
    status: text('status').notNull(),
    branchName: text('branch_name').notNull(),
    logFilePath: text('log_file_path').notNull(),
    createdAt: integer('created_at').notNull().default(nowMs),
    startedAt: integer('started_at'),
    finishedAt: integer('finished_at'),
    errorMessage: text('error_message'),
  },
  (table) => [
    index('agent_runs_workspace_id_idx').on(table.workspaceId),
    index('agent_runs_created_at_idx').on(table.createdAt),
    index('agent_runs_status_idx').on(table.status),
  ],
);

export const agentRunEvents = sqliteTable(
  'agent_run_events',
  {
    id: text('id').primaryKey(),
    runId: text('run_id').notNull(),
    type: text('type').notNull(),
    message: text('message').notNull(),
    createdAt: integer('created_at').notNull().default(nowMs),
  },
  (table) => [
    index('agent_run_events_run_id_idx').on(table.runId),
    index('agent_run_events_created_at_idx').on(table.createdAt),
  ],
);

export const agentRunCommits = sqliteTable(
  'agent_run_commits',
  {
    runId: text('run_id').notNull(),
    sha: text('sha').notNull(),
    createdAt: integer('created_at').notNull().default(nowMs),
  },
  (table) => [
    index('agent_run_commits_run_id_idx').on(table.runId),
  ],
);

export const dbSchema = {
  agentRunCommits,
  agentRunEvents,
  agentRuns,
  agentRuntimeProfiles,
  notes,
  workspaces,
};
