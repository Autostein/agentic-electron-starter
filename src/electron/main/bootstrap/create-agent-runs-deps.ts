import fs from 'node:fs';
import path from 'node:path';
import type { DockerImageBuilder, AgentRuntimeProfileRepository } from '@/core/agent-runtime/domain';
import type { WorkspaceRepository } from '@/core/workspaces/domain';
import { LocalGitCommitInspector } from '@/infrastructure/main/git/git-commit-inspector';
import { SQLiteAgentRunRepository } from '@/infrastructure/main/persistence/sqlite-agent-run-repository';
import { UtilityProcessAgentRunner } from '@/infrastructure/main/sandcastle/utility-process-agent-runner';

export type AgentRunsDepsOptions = {
  userDataPath: string;
  workerPath: string;
};

export type AgentRunsSharedDeps = {
  dockerImageBuilder: DockerImageBuilder;
  profileRepository: AgentRuntimeProfileRepository;
  workspaceRepository: WorkspaceRepository;
};

export function createAgentRunsDeps(
  options: AgentRunsDepsOptions,
  sharedDeps: AgentRunsSharedDeps,
) {
  const runLogsPath = path.join(options.userDataPath, 'agent-runs', 'logs');
  const worktreesPath = path.join(options.userDataPath, 'agent-runs', 'worktrees');
  fs.mkdirSync(runLogsPath, { recursive: true });
  fs.mkdirSync(worktreesPath, { recursive: true });

  return {
    agentRunRepository: new SQLiteAgentRunRepository(),
    agentRunner: new UtilityProcessAgentRunner({
      workerPath: options.workerPath,
      worktreesPath,
    }),
    createLogFilePath: (runId: string) => path.join(runLogsPath, `${runId}.log`),
    gitCommitReadService: new LocalGitCommitInspector(),
    dockerImageBuilder: sharedDeps.dockerImageBuilder,
    profileRepository: sharedDeps.profileRepository,
    workspaceRepository: sharedDeps.workspaceRepository,
  };
}

export type AgentRunsDeps = ReturnType<typeof createAgentRunsDeps>;
