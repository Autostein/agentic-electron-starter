import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { closeMainDatabase, initializeMainDatabase } from '../db/client';
import { SQLiteAgentRunRepository } from '../sqlite-agent-run-repository';
import { SQLiteAgentRuntimeSettingsRepository } from '../sqlite-agent-runtime-settings-repository';
import { SQLiteProjectRepository } from '../sqlite-project-repository';

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

  it('persists projects, runtime settings, runs, events, and commits', async () => {
    const projects = new SQLiteProjectRepository();
    const settings = new SQLiteAgentRuntimeSettingsRepository();
    const runs = new SQLiteAgentRunRepository();

    const project = await projects.upsertProject(
      { path: '/tmp/repo', name: 'repo', currentBranch: 'main' },
      { createdAt: 100, updatedAt: 100 },
    );
    const updatedSettings = await settings.updateSettings(
      { dockerImageName: 'agentic:test' },
      200,
    );
    const run = await runs.createRun({
      id: 'run-1',
      projectId: project.id,
      projectPath: project.path,
      projectName: project.name,
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

    await expect(projects.listProjects()).resolves.toHaveLength(1);
    expect(updatedSettings.dockerImageName).toBe('agentic:test');
    expect((await runs.getRun(run.id))?.status).toBe('running');
    await expect(runs.listEvents(run.id)).resolves.toEqual([
      { id: 'event-1', runId: run.id, type: 'log', message: 'hello', createdAt: 500 },
    ]);
    await expect(runs.listCommits(run.id)).resolves.toEqual([
      { runId: run.id, sha: 'abc123', createdAt: 600 },
    ]);
  });
});
