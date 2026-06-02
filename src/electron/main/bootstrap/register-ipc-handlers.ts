import type { AgentRunEvent } from '@/core/agent-runs/domain';
import {
  assertRuntimeProfileAuthAvailable,
  listProviderAuthStatuses as getProviderAuthStatuses,
} from '@/infrastructure/main/agent-runtime/cli-auth-paths';
import type { DockerImageBuildEventResult } from '@/contracts/ipc/agent-runtime.contract';
import { registerAgentRunsIpcHandlers } from '../ipc/register-agent-runs-ipc';
import { registerAgentRuntimeIpcHandlers } from '../ipc/register-agent-runtime-ipc';
import { registerAppInfoIpcHandlers } from '../ipc/register-app-info-ipc';
import { registerNotesIpcHandlers } from '../ipc/register-notes-ipc';
import { registerWorkspacesIpcHandlers } from '../ipc/register-workspaces-ipc';
import type { MainProcessDeps } from './create-main-process-deps';

export type RegisterIpcHandlersOptions = {
  deps: MainProcessDeps;
  now: () => number;
  pickDirectory: () => Promise<string | null>;
  publishAgentRunEvent: (event: AgentRunEvent) => void;
  publishBuildEvent: (event: DockerImageBuildEventResult) => void;
};

export function registerIpcHandlers(options: RegisterIpcHandlersOptions): void {
  const { deps } = options;

  registerAppInfoIpcHandlers({ appInfoProvider: deps.appInfoProvider });
  registerNotesIpcHandlers({ noteRepository: deps.noteRepository });
  registerWorkspacesIpcHandlers({
    agentRunRepository: deps.agentRuns.agentRunRepository,
    gitRepositoryInspector: deps.workspaces.gitRepositoryInspector,
    workspaceRepository: deps.workspaces.workspaceRepository,
    pickDirectory: options.pickDirectory,
    now: options.now,
  });
  registerAgentRuntimeIpcHandlers({
    dockerImageBuilder: deps.agentRuntime.dockerImageBuilder,
    profileRepository: deps.agentRuntime.profileRepository,
    listProviderAuthStatuses: () => getProviderAuthStatuses({ now: options.now }),
    copyStarterProfile: (profileId) => (
      deps.agentRuntime.runtimeProfileFiles.copyStarterProfile(profileId)
    ),
    runtimeProfileFiles: deps.agentRuntime.runtimeProfileFiles,
    validateRuntimeProfile: assertRuntimeProfileAuthAvailable,
    publishBuildEvent: options.publishBuildEvent,
    now: options.now,
  });
  registerAgentRunsIpcHandlers({
    agentRunRepository: deps.agentRuns.agentRunRepository,
    agentRunner: deps.agentRuns.agentRunner,
    gitCommitReadService: deps.agentRuns.gitCommitReadService,
    workspaceRepository: deps.agentRuns.workspaceRepository,
    profileRepository: deps.agentRuns.profileRepository,
    dockerImageBuilder: deps.agentRuns.dockerImageBuilder,
    validateRuntimeProfile: assertRuntimeProfileAuthAvailable,
    createLogFilePath: deps.agentRuns.createLogFilePath,
    publishEvent: options.publishAgentRunEvent,
    now: options.now,
  });
}
