import { fileURLToPath } from 'node:url';
import { app, BrowserWindow, dialog } from 'electron';
import started from 'electron-squirrel-startup';
import type { AgentRunEvent } from '@/core/agent-runs/domain';
import { AGENT_RUNS_IPC_CHANNELS } from '@/contracts/ipc/agent-runs.contract';
import {
  AGENT_RUNTIME_IPC_CHANNELS,
  type DockerImageBuildEventResult,
} from '@/contracts/ipc/agent-runtime.contract';
import { closeMainDatabase, initializeMainDatabase } from '@/infrastructure/main/persistence/db/client';
import { createMainProcessDeps } from './bootstrap/create-main-process-deps';
import { registerIpcHandlers } from './bootstrap/register-ipc-handlers';
import { getErrorMessage } from './shared/errors';
import { createMainWindow } from './window';

if (started) {
  app.quit();
}

app.whenReady()
  .then(() => {
    const databaseOptions = {
      userDataPath: app.getPath('userData'),
      resourcesPath: process.resourcesPath,
      isPackaged: app.isPackaged,
    };
    initializeMainDatabase(databaseOptions);

    const deps = createMainProcessDeps({
      ...databaseOptions,
      workerPath: fileURLToPath(new URL('./agent-runner-worker.js', import.meta.url)),
    });

    registerIpcHandlers({
      deps,
      pickDirectory,
      publishAgentRunEvent,
      publishBuildEvent,
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

function publishBuildEvent(event: DockerImageBuildEventResult): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(AGENT_RUNTIME_IPC_CHANNELS.buildEvent, event);
  }
}
