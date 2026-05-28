import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { closeMainDatabase, getMainDatabase, initializeMainDatabase } from '../db/client';
import { SQLiteAgentRunRepository } from '../sqlite-agent-run-repository';
import { SQLiteAgentRuntimeProfileRepository } from '../sqlite-agent-runtime-profile-repository';
import { SQLiteWorkspaceRepository } from '../sqlite-workspace-repository';

const databaseFileName = 'agentic-electron-starter.db';
const statementBreakpoint = '--> statement-breakpoint';

describe('SQLite agent orchestration repositories', () => {
  let userDataPath: string;

  beforeEach(() => {
    userDataPath = fs.mkdtempSync(path.join(os.tmpdir(), 'agentic-electron-runs-'));
    initializeMainDatabase({
      userDataPath,
      resourcesPath: process.cwd(),
      isPackaged: false,
    });
  });

  afterEach(() => {
    closeMainDatabase();
    fs.rmSync(userDataPath, { recursive: true, force: true });
  });

  it('persists workspaces, runtime profiles, runs, events, and commits', async () => {
    const workspaces = new SQLiteWorkspaceRepository();
    const profiles = new SQLiteAgentRuntimeProfileRepository();
    const runs = new SQLiteAgentRunRepository();

    const workspace = await workspaces.upsertWorkspace(
      { path: '/tmp/repo', name: 'repo', currentBranch: 'main' },
      { createdAt: 100, updatedAt: 100 },
    );
    const starter = await profiles.getProfile('starter');
    const updatedProfile = await profiles.updateProfile(
      'starter',
      { codexDefaultModel: 'gpt-5.4-test' },
      200,
    );
    const copy = await profiles.createProfile(
      {
        id: 'profile-copy',
        name: 'Starter copy',
        sourceKind: 'user-managed-copy',
        profilePath: path.join(userDataPath, 'agent-runtime-profiles', 'profile-copy'),
        imageName: 'agentic-electron-starter-runtime:profile-copy',
        claudeDefaultModel: 'claude-opus-4-7',
        codexDefaultModel: 'gpt-5.4',
        claudeAuthMountEnabled: false,
        codexAuthMountEnabled: false,
      },
      { createdAt: 250, updatedAt: 250 },
    );
    const run = await runs.createRun({
      id: 'run-1',
      workspaceId: workspace.id,
      workspacePath: workspace.path,
      workspaceName: workspace.name,
      runtimeProfileId: copy.id,
      runtimeProfileName: copy.name,
      runtimeImageName: copy.imageName,
      provider: 'codex',
      model: 'gpt-5.4',
      prompt: 'Implement it',
      maxIterations: 1,
      branchName: 'agentic/run-1-implement-it',
      logFilePath: '/tmp/run.log',
      createdAt: 300,
    });

    await runs.updateRunStatus(run.id, 'running', { startedAt: 400 });
    await runs.appendEvent({
      id: 'event-1',
      runId: run.id,
      type: 'log',
      message: 'hello',
      createdAt: 500,
    });
    await runs.appendCommit({ runId: run.id, sha: 'abc123', createdAt: 600 });

    await expect(workspaces.listWorkspaces()).resolves.toHaveLength(1);
    expect(starter?.id).toBe('starter');
    expect(updatedProfile.codexDefaultModel).toBe('gpt-5.4-test');
    await expect(profiles.listProfiles()).resolves.toHaveLength(2);
    expect((await runs.getRun(run.id))?.status).toBe('running');
    expect(await runs.getRun(run.id)).toMatchObject({
      runtimeProfileId: 'profile-copy',
      runtimeProfileName: 'Starter copy',
      runtimeImageName: 'agentic-electron-starter-runtime:profile-copy',
    });
    await expect(runs.listEvents(run.id)).resolves.toEqual([
      { id: 'event-1', runId: run.id, type: 'log', message: 'hello', createdAt: 500 },
    ]);
    await expect(runs.listCommits(run.id)).resolves.toEqual([
      { runId: run.id, sha: 'abc123', createdAt: 600 },
    ]);
  });

  it('migrates legacy projects and run snapshots into workspaces', async () => {
    closeMainDatabase();
    fs.rmSync(userDataPath, { recursive: true, force: true });
    fs.mkdirSync(userDataPath, { recursive: true });
    createLegacyProjectDatabase(userDataPath);

    initializeMainDatabase({
      userDataPath,
      resourcesPath: process.cwd(),
      isPackaged: false,
    });

    const db = getMainDatabase();
    const workspaceTable = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'workspaces'")
      .get();
    const oldProjectTable = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'projects'")
      .get();
    const workspaceIndex = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'agent_runs_workspace_id_idx'")
      .get();

    expect(workspaceTable).toBeTruthy();
    expect(oldProjectTable).toBeUndefined();
    expect(workspaceIndex).toBeTruthy();
    await expect(new SQLiteWorkspaceRepository().listWorkspaces()).resolves.toEqual([
      {
        id: 'workspace-legacy',
        path: '/legacy/repo',
        name: 'repo',
        currentBranch: 'main',
        createdAt: 10,
        updatedAt: 20,
      },
    ]);
    await expect(new SQLiteAgentRunRepository().getRun('run-legacy')).resolves.toMatchObject({
      id: 'run-legacy',
      workspaceId: 'workspace-legacy',
      workspacePath: '/legacy/repo',
      workspaceName: 'repo',
      runtimeProfileId: 'starter',
    });
  });
});

function createLegacyProjectDatabase(userDataPath: string): void {
  const db = new DatabaseSync(path.join(userDataPath, databaseFileName));
  const migrationNames = [
    '0000_wild_fixer.sql',
    '0001_married_the_executioner.sql',
    '0002_runtime_profiles.sql',
  ];

  for (const migrationName of migrationNames) {
    const migrationSql = fs.readFileSync(path.join(process.cwd(), 'drizzle', migrationName), 'utf8');
    const statements = migrationSql
      .split(statementBreakpoint)
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      db.exec(statement);
    }
  }

  db.exec(`
    CREATE TABLE __agentic_migrations (
      name TEXT PRIMARY KEY NOT NULL,
      applied_at INTEGER NOT NULL
    )
  `);

  for (const migrationName of migrationNames) {
    db.prepare('INSERT INTO __agentic_migrations (name, applied_at) VALUES (?, ?)').run(
      migrationName,
      1,
    );
  }

  db.prepare(`
    INSERT INTO projects (id, path, name, current_branch, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('workspace-legacy', '/legacy/repo', 'repo', 'main', 10, 20);
  db.prepare(`
    INSERT INTO agent_runs (
      id, project_id, project_path, project_name, runtime_profile_id, runtime_profile_name,
      runtime_image_name, provider, model, prompt, max_iterations, status, branch_name,
      log_file_path, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'run-legacy',
    'workspace-legacy',
    '/legacy/repo',
    'repo',
    'starter',
    'Starter',
    'agentic-electron-starter-runtime:starter',
    'codex',
    'gpt-5.4',
    'Prompt',
    1,
    'queued',
    'agentic/run-legacy',
    '/logs/run-legacy.log',
    30,
  );
  db.close();
}
