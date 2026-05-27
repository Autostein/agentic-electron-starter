import { ElectronAppInfoProvider } from '../../infrastructure/main/app-info/electron-app-info-provider';
import { SQLiteNoteRepository } from '../../infrastructure/main/persistence/sqlite-note-repository';

export function createMainProcessDeps() {
  return {
    appInfoProvider: new ElectronAppInfoProvider(),
    noteRepository: new SQLiteNoteRepository(),
  };
}

export type MainProcessDeps = ReturnType<typeof createMainProcessDeps>;
