import { app, BrowserWindow } from 'electron';
import started from 'electron-squirrel-startup';
import { closeMainDatabase, initializeMainDatabase } from '../../infrastructure/main/persistence/db/client';
import { createMainProcessDeps } from './deps';
import { registerAppInfoIpcHandlers } from './ipc/register-app-info-ipc';
import { registerNotesIpcHandlers } from './ipc/register-notes-ipc';
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

    const deps = createMainProcessDeps();
    registerAppInfoIpcHandlers({ appInfoProvider: deps.appInfoProvider });
    registerNotesIpcHandlers({ noteRepository: deps.noteRepository });

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
