import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { transitionAgentRunStatus } from '@/core/agent-runs/domain';
import { closeMainDatabase, initializeMainDatabase } from '../db/client';
import { SQLiteAgentRunRepository } from '../sqlite-agent-run-repository';
import { SQLiteAgentRuntimeProfileRepository } from '../sqlite-agent-runtime-profile-repository';
import { SQLiteWorkspaceRepository } from '../sqlite-workspace-repository';

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

    const workspace = await workspaces.createWorkspace(
      { id: 'workspace-1', name: 'Website' },
      { createdAt: 100, updatedAt: 100 },
    );
    const appFolder = await workspaces.addFolder(
      {
        id: 'folder-app',
        workspaceId: workspace.id,
        label: 'Application',
        path: '/tmp/repo',
        currentBranch: 'main',
      },
      { createdAt: 110, updatedAt: 110 },
    );
    await workspaces.addFolder(
      {
        id: 'folder-docs',
        workspaceId: workspace.id,
        label: 'Docs',
        path: '/tmp/docs',
        currentBranch: 'main',
      },
      { createdAt: 120, updatedAt: 120 },
    );
    const starter = await profiles.getProfile('starter');
    const updatedProfile = await profiles.updateProfile(
      'starter',
      { codexAuthMountEnabled: true },
      200,
    );
    const copy = await profiles.createProfile(
      {
        id: 'profile-copy',
        name: 'Starter copy',
        sourceKind: 'user-managed-copy',
        profilePath: path.join(userDataPath, 'agent-runtime-profiles', 'profile-copy'),
        imageName: 'agentic-electron-starter-runtime:profile-copy',
        claudeAuthMountEnabled: false,
        codexAuthMountEnabled: false,
      },
      { createdAt: 250, updatedAt: 250 },
    );
    const run = await runs.createRun({
      id: 'run-1',
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      targetFolderId: appFolder.id,
      targetFolderPath: appFolder.path,
      targetFolderLabel: appFolder.label,
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

    await runs.applyRunStatusTransition(
      transitionAgentRunStatus(run, { status: 'running', now: 400 }),
    );
    await runs.appendEvent({
      id: 'event-1',
      runId: run.id,
      type: 'log',
      message: 'hello',
      createdAt: 500,
    });
    await runs.appendCommit({ runId: run.id, sha: 'abc123', createdAt: 600 });

    await expect(workspaces.listWorkspaces()).resolves.toEqual([
      {
        id: workspace.id,
        name: 'Website',
        folderCount: 2,
        createdAt: 100,
        updatedAt: 100,
      },
    ]);
    await expect(workspaces.getWorkspaceDetail(workspace.id)).resolves.toMatchObject({
      id: workspace.id,
      name: 'Website',
      folders: [
        {
          id: 'folder-app',
          label: 'Application',
          path: '/tmp/repo',
        },
        {
          id: 'folder-docs',
          label: 'Docs',
          path: '/tmp/docs',
        },
      ],
    });
    expect(starter?.id).toBe('starter');
    expect(updatedProfile.codexAuthMountEnabled).toBe(true);
    await expect(profiles.listProfiles()).resolves.toHaveLength(2);
    expect((await runs.getRun(run.id))?.status).toBe('running');
    expect(await runs.getRun(run.id)).toMatchObject({
      workspaceId: workspace.id,
      workspaceName: 'Website',
      targetFolderId: 'folder-app',
      targetFolderPath: '/tmp/repo',
      targetFolderLabel: 'Application',
      runtimeProfileId: 'profile-copy',
      runtimeProfileName: 'Starter copy',
      runtimeImageName: 'agentic-electron-starter-runtime:profile-copy',
    });
    await expect(runs.hasActiveRunForTargetFolder(appFolder.id)).resolves.toBe(true);
    await expect(runs.listEvents(run.id)).resolves.toEqual([
      { id: 'event-1', runId: run.id, type: 'log', message: 'hello', createdAt: 500 },
    ]);
    await expect(runs.listCommits(run.id)).resolves.toEqual([
      { runId: run.id, sha: 'abc123', createdAt: 600 },
    ]);
  });

  it('enforces workspace folder label and path uniqueness per workspace', async () => {
    const workspaces = new SQLiteWorkspaceRepository();
    const workspace = await workspaces.createWorkspace(
      { id: 'workspace-1', name: 'Website' },
      { createdAt: 100, updatedAt: 100 },
    );

    await workspaces.addFolder(
      {
        id: 'folder-app',
        workspaceId: workspace.id,
        label: 'Application',
        path: '/tmp/repo',
        currentBranch: 'main',
      },
      { createdAt: 110, updatedAt: 110 },
    );

    await expect(workspaces.addFolder(
      {
        id: 'folder-path-copy',
        workspaceId: workspace.id,
        label: 'Other',
        path: '/tmp/repo',
        currentBranch: 'main',
      },
      { createdAt: 120, updatedAt: 120 },
    )).rejects.toMatchObject({ message: 'Folder path already exists in this workspace.' });
    await expect(workspaces.addFolder(
      {
        id: 'folder-label-copy',
        workspaceId: workspace.id,
        label: 'application',
        path: '/tmp/other',
        currentBranch: 'main',
      },
      { createdAt: 130, updatedAt: 130 },
    )).rejects.toMatchObject({ message: 'Folder label already exists in this workspace.' });
  });
});
