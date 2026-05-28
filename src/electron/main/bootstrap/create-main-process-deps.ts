import { ElectronAppInfoProvider } from '@/infrastructure/main/app-info/electron-app-info-provider';
import { SQLiteNoteRepository } from '@/infrastructure/main/persistence/sqlite-note-repository';
import { createAgentRunsDeps } from './create-agent-runs-deps';
import { createAgentRuntimeDeps } from './create-agent-runtime-deps';
import { createWorkspacesDeps } from './create-workspaces-deps';

export type MainProcessDepsOptions = {
  userDataPath: string;
  resourcesPath: string;
  isPackaged: boolean;
  workerPath: string;
};

export function createMainProcessDeps(options: MainProcessDepsOptions) {
  const workspaces = createWorkspacesDeps();
  const agentRuntime = createAgentRuntimeDeps(options);
  const agentRuns = createAgentRunsDeps(
    {
      userDataPath: options.userDataPath,
      workerPath: options.workerPath,
    },
    {
      dockerImageBuilder: agentRuntime.dockerImageBuilder,
      profileRepository: agentRuntime.profileRepository,
      workspaceRepository: workspaces.workspaceRepository,
    },
  );

  return {
    agentRuns,
    agentRuntime,
    appInfoProvider: new ElectronAppInfoProvider(),
    noteRepository: new SQLiteNoteRepository(),
    workspaces,
  };
}

export type MainProcessDeps = ReturnType<typeof createMainProcessDeps>;
