import { fileURLToPath } from 'node:url';
import { app, BrowserWindow, dialog } from 'electron';
import started from 'electron-squirrel-startup';
import type { AgentRunEvent } from '@/core/agent-runs/domain';
import type { DockerImageBuildEvent } from '@/core/agent-runtime/domain';
import { AGENT_RUNS_IPC_CHANNELS } from '@/contracts/ipc/agent-runs.contract';
import { AGENT_RUNTIME_IPC_CHANNELS } from '@/contracts/ipc/agent-runtime.contract';
import { closeMainDatabase, initializeMainDatabase } from '@/infrastructure/main/persistence/db/client';
import { assertRuntimeProfileAuthAvailable } from '@/infrastructure/main/agent-runtime/cli-auth-paths';
import { createMainProcessDeps } from './deps';
import { registerAgentRunsIpcHandlers } from './ipc/register-agent-runs-ipc';
import { registerAgentRuntimeIpcHandlers } from './ipc/register-agent-runtime-ipc';
import { registerAppInfoIpcHandlers } from './ipc/register-app-info-ipc';
import { registerNotesIpcHandlers } from './ipc/register-notes-ipc';
import { registerWorkspacesIpcHandlers } from './ipc/register-workspaces-ipc';
import { getErrorMessage } from './shared/errors';
import { createMainWindow } from './window';

if (started) {
  app.quit();
}

app.whenReady()
  .then(() => {
    initializeMainDatabase({
      userDataPath: app.getPath('userData'),
      resourcesPath: process.resourcesPath,
      isPackaged: app.isPackaged,
    });

    const deps = createMainProcessDeps({
      userDataPath: app.getPath('userData'),
      resourcesPath: process.resourcesPath,
      isPackaged: app.isPackaged,
      workerPath: fileURLToPath(new URL('./agent-runner-worker.js', import.meta.url)),
    });
    registerAppInfoIpcHandlers({ appInfoProvider: deps.appInfoProvider });
    registerNotesIpcHandlers({ noteRepository: deps.noteRepository });
    registerWorkspacesIpcHandlers({
      gitRepositoryInspector: deps.gitRepositoryInspector,
      workspaceRepository: deps.workspaceRepository,
      pickDirectory,
      now: Date.now,
    });
    registerAgentRuntimeIpcHandlers({
      dockerImageBuilder: deps.dockerImageBuilder,
      profileRepository: deps.profileRepository,
      copyStarterProfile: (profileId) => deps.runtimeProfileFiles.copyStarterProfile(profileId),
      runtimeProfileFiles: deps.runtimeProfileFiles,
      validateRuntimeProfile: assertRuntimeProfileAuthAvailable,
      publishBuildEvent,
      now: Date.now,
    });
    registerAgentRunsIpcHandlers({
      agentRunRepository: deps.agentRunRepository,
      agentRunner: deps.agentRunner,
      gitCommitReadService: deps.gitCommitReadService,
      workspaceRepository: deps.workspaceRepository,
      profileRepository: deps.profileRepository,
      dockerImageBuilder: deps.dockerImageBuilder,
      validateRuntimeProfile: assertRuntimeProfileAuthAvailable,
      createLogFilePath: deps.createLogFilePath,
      publishEvent: publishAgentRunEvent,
      now: Date.now,
    });

    createMainWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  })
  .catch((error: unknown) => {
    console.error(`Failed to start application: ${getErrorMessage(error)}`);
    app.quit();
  });

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  closeMainDatabase();
});

async function pickDirectory(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });

  return result.canceled ? null : result.filePaths[0] ?? null;
}

function publishAgentRunEvent(event: AgentRunEvent): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(AGENT_RUNS_IPC_CHANNELS.event, event);
  }
}

function publishBuildEvent(event: DockerImageBuildEvent & { profileId: string }): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(AGENT_RUNTIME_IPC_CHANNELS.buildEvent, event);
  }
}
