import fs from 'node:fs';
import path from 'node:path';
import { ElectronAppInfoProvider } from '@/infrastructure/main/app-info/electron-app-info-provider';
import { RuntimeProfileFiles } from '@/infrastructure/main/agent-runtime/runtime-profile-files';
import { LocalGitCommitInspector } from '@/infrastructure/main/git/git-commit-inspector';
import { LocalGitRepositoryInspector } from '@/infrastructure/main/git/git-repository-inspector';
import { SQLiteAgentRunRepository } from '@/infrastructure/main/persistence/sqlite-agent-run-repository';
import { SQLiteAgentRuntimeProfileRepository } from '@/infrastructure/main/persistence/sqlite-agent-runtime-profile-repository';
import { SQLiteNoteRepository } from '@/infrastructure/main/persistence/sqlite-note-repository';
import { SQLiteWorkspaceRepository } from '@/infrastructure/main/persistence/sqlite-workspace-repository';
import { LocalDockerImageBuilder } from '@/infrastructure/main/sandcastle/docker-image-builder';
import { UtilityProcessAgentRunner } from '@/infrastructure/main/sandcastle/utility-process-agent-runner';

export type MainProcessDepsOptions = {
  userDataPath: string;
  resourcesPath: string;
  isPackaged: boolean;
  workerPath: string;
};

export function createMainProcessDeps(options: MainProcessDepsOptions) {
  const runLogsPath = path.join(options.userDataPath, 'agent-runs', 'logs');
  const worktreesPath = path.join(options.userDataPath, 'agent-runs', 'worktrees');
  const runtimeProfileFiles = new RuntimeProfileFiles({
    userDataPath: options.userDataPath,
    resourcesPath: options.resourcesPath,
    isPackaged: options.isPackaged,
  });
  fs.mkdirSync(runLogsPath, { recursive: true });
  fs.mkdirSync(worktreesPath, { recursive: true });

  return {
    agentRunRepository: new SQLiteAgentRunRepository(),
    agentRunner: new UtilityProcessAgentRunner({
      workerPath: options.workerPath,
      worktreesPath,
    }),
    dockerImageBuilder: new LocalDockerImageBuilder({
      userDataPath: options.userDataPath,
      resourcesPath: options.resourcesPath,
      isPackaged: options.isPackaged,
    }),
    appInfoProvider: new ElectronAppInfoProvider(),
    createLogFilePath: (runId: string) => path.join(runLogsPath, `${runId}.log`),
    runtimeProfileFiles,
    gitCommitReadService: new LocalGitCommitInspector(),
    gitRepositoryInspector: new LocalGitRepositoryInspector(),
    noteRepository: new SQLiteNoteRepository(),
    workspaceRepository: new SQLiteWorkspaceRepository(),
    profileRepository: new SQLiteAgentRuntimeProfileRepository(),
  };
}

export type MainProcessDeps = ReturnType<typeof createMainProcessDeps>;
