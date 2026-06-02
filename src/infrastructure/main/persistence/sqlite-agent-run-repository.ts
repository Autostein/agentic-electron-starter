import type {
  AgentRun,
  AgentRunCommit,
  AgentRunEvent,
  AgentRunEventType,
  AgentRunRepository,
  AgentRunStatusTransition,
  AgentRunStatus,
  CreateAgentRunInput,
} from '@/core/agent-runs/domain';
import type { AgentProviderId } from '@/core/agent-runtime/domain';
import { getMainDatabase } from './db/client';

export class SQLiteAgentRunRepository implements AgentRunRepository {
  async createRun(input: CreateAgentRunInput): Promise<AgentRun> {
    getMainDatabase()
      .prepare(
        `
          INSERT INTO agent_runs (
            id, workspace_id, workspace_name, target_folder_id, target_folder_path,
            target_folder_label, runtime_profile_id, runtime_profile_name,
            runtime_image_name, provider, model, prompt, max_iterations, status, branch_name,
            log_file_path, created_at, started_at, finished_at, error_message
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL)
        `,
      )
      .run(
        input.id,
        input.workspaceId,
        input.workspaceName,
        input.targetFolderId,
        input.targetFolderPath,
        input.targetFolderLabel,
        input.runtimeProfileId,
        input.runtimeProfileName,
        input.runtimeImageName,
        input.provider,
        input.model,
        input.prompt,
        input.maxIterations,
        'queued',
        input.branchName,
        input.logFilePath,
        input.createdAt,
      );

    const run = await this.getRun(input.id);

    if (!run) {
      throw new Error('Failed to create agent run.');
    }

    return run;
  }

  async getRun(id: string): Promise<AgentRun | null> {
    const row = getMainDatabase()
      .prepare(
        `
          SELECT
            id,
            workspace_id AS workspaceId,
            workspace_name AS workspaceName,
            target_folder_id AS targetFolderId,
            target_folder_path AS targetFolderPath,
            target_folder_label AS targetFolderLabel,
            runtime_profile_id AS runtimeProfileId,
            runtime_profile_name AS runtimeProfileName,
            runtime_image_name AS runtimeImageName,
            provider,
            model,
            prompt,
            max_iterations AS maxIterations,
            status,
            branch_name AS branchName,
            log_file_path AS logFilePath,
            created_at AS createdAt,
            started_at AS startedAt,
            finished_at AS finishedAt,
            error_message AS errorMessage
          FROM agent_runs
          WHERE id = ?
        `,
      )
      .get(id) as AgentRunRow | undefined;

    return row ? toRun(row) : null;
  }

  async listRuns(workspaceId?: string): Promise<AgentRun[]> {
    const db = getMainDatabase();
    const rows = workspaceId
      ? db
        .prepare(
          `
            SELECT
              id,
              workspace_id AS workspaceId,
              workspace_name AS workspaceName,
              target_folder_id AS targetFolderId,
              target_folder_path AS targetFolderPath,
              target_folder_label AS targetFolderLabel,
              runtime_profile_id AS runtimeProfileId,
              runtime_profile_name AS runtimeProfileName,
              runtime_image_name AS runtimeImageName,
              provider,
              model,
              prompt,
              max_iterations AS maxIterations,
              status,
              branch_name AS branchName,
              log_file_path AS logFilePath,
              created_at AS createdAt,
              started_at AS startedAt,
              finished_at AS finishedAt,
              error_message AS errorMessage
            FROM agent_runs
            WHERE workspace_id = ?
            ORDER BY created_at DESC
          `,
        )
        .all(workspaceId)
      : db
        .prepare(
          `
            SELECT
              id,
              workspace_id AS workspaceId,
              workspace_name AS workspaceName,
              target_folder_id AS targetFolderId,
              target_folder_path AS targetFolderPath,
              target_folder_label AS targetFolderLabel,
              runtime_profile_id AS runtimeProfileId,
              runtime_profile_name AS runtimeProfileName,
              runtime_image_name AS runtimeImageName,
              provider,
              model,
              prompt,
              max_iterations AS maxIterations,
              status,
              branch_name AS branchName,
              log_file_path AS logFilePath,
              created_at AS createdAt,
              started_at AS startedAt,
              finished_at AS finishedAt,
              error_message AS errorMessage
            FROM agent_runs
            ORDER BY created_at DESC
          `,
        )
        .all();

    return (rows as AgentRunRow[]).map(toRun);
  }

  async hasActiveRunForTargetFolder(targetFolderId: string): Promise<boolean> {
    const row = getMainDatabase()
      .prepare(
        `
          SELECT id
          FROM agent_runs
          WHERE target_folder_id = ?
            AND status IN ('queued', 'running')
          LIMIT 1
        `,
      )
      .get(targetFolderId);

    return row !== undefined;
  }

  async applyRunStatusTransition(transition: AgentRunStatusTransition): Promise<void> {
    const run = transition.nextRun;
    getMainDatabase()
      .prepare(
        `
          UPDATE agent_runs
          SET status = ?, started_at = ?, finished_at = ?, error_message = ?
          WHERE id = ?
        `,
      )
      .run(
        run.status,
        run.startedAt,
        run.finishedAt,
        run.errorMessage,
        transition.runId,
      );
  }

  async appendEvent(event: AgentRunEvent): Promise<void> {
    getMainDatabase()
      .prepare(
        `
          INSERT INTO agent_run_events (id, run_id, type, message, created_at)
          VALUES (?, ?, ?, ?, ?)
        `,
      )
      .run(event.id, event.runId, event.type, event.message, event.createdAt);
  }

  async listEvents(runId: string): Promise<AgentRunEvent[]> {
    const rows = getMainDatabase()
      .prepare(
        `
          SELECT id, run_id AS runId, type, message, created_at AS createdAt
          FROM agent_run_events
          WHERE run_id = ?
          ORDER BY created_at ASC
        `,
      )
      .all(runId) as AgentRunEventRow[];

    return rows.map(toEvent);
  }

  async appendCommit(commit: AgentRunCommit): Promise<void> {
    getMainDatabase()
      .prepare(
        `
          INSERT INTO agent_run_commits (run_id, sha, created_at)
          VALUES (?, ?, ?)
        `,
      )
      .run(commit.runId, commit.sha, commit.createdAt);
  }

  async listCommits(runId: string): Promise<AgentRunCommit[]> {
    const rows = getMainDatabase()
      .prepare(
        `
          SELECT run_id AS runId, sha, created_at AS createdAt
          FROM agent_run_commits
          WHERE run_id = ?
          ORDER BY created_at ASC
        `,
      )
      .all(runId) as AgentRunCommit[];

    return rows;
  }
}

type AgentRunRow = {
  id: string;
  workspaceId: string;
  workspaceName: string;
  targetFolderId: string;
  targetFolderPath: string;
  targetFolderLabel: string;
  runtimeProfileId: string;
  runtimeProfileName: string;
  runtimeImageName: string;
  provider: AgentProviderId;
  model: string;
  prompt: string;
  maxIterations: number;
  status: AgentRunStatus;
  branchName: string;
  logFilePath: string;
  createdAt: number;
  startedAt: number | null;
  finishedAt: number | null;
  errorMessage: string | null;
};

type AgentRunEventRow = {
  id: string;
  runId: string;
  type: AgentRunEventType;
  message: string;
  createdAt: number;
};

function toRun(row: AgentRunRow): AgentRun {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    workspaceName: row.workspaceName,
    targetFolderId: row.targetFolderId,
    targetFolderPath: row.targetFolderPath,
    targetFolderLabel: row.targetFolderLabel,
    runtimeProfileId: row.runtimeProfileId,
    runtimeProfileName: row.runtimeProfileName,
    runtimeImageName: row.runtimeImageName,
    provider: row.provider,
    model: row.model,
    prompt: row.prompt,
    maxIterations: row.maxIterations,
    status: row.status,
    branchName: row.branchName,
    logFilePath: row.logFilePath,
    createdAt: row.createdAt,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    errorMessage: row.errorMessage,
  };
}

function toEvent(row: AgentRunEventRow): AgentRunEvent {
  return {
    id: row.id,
    runId: row.runId,
    type: row.type,
    message: row.message,
    createdAt: row.createdAt,
  };
}
