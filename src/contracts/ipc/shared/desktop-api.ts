import type { AppInfoResult } from '../app-info.contract';
import type {
  AgentRunDetailResult,
  AgentRunCommitDetail,
  AgentRunCommitFileDiff,
  AgentRunEventResult,
  AgentRunResult,
  CancelAgentRunInput,
  GetAgentRunInput,
  GetAgentRunCommitDetailsInput,
  GetAgentRunCommitFileDiffInput,
  ListAgentRunsInput,
  StartAgentRunInput,
  WatchAgentRunInput,
} from '../agent-runs.contract';
import type {
  AgentRuntimeProfileResult,
  DuplicateStarterRuntimeProfileInput,
  DockerImageBuildEventResult,
  DockerImageBuildResult,
  DockerImageStatusResult,
  GetAgentRuntimeProfileInput,
  RuntimeProfileDockerfileInput,
  RuntimeProfileDockerfileResult,
  RuntimeProfileImageInput,
  UpdateAgentRuntimeProfileInput,
  UpdateRuntimeProfileDockerfileInput,
  UpdateRuntimeProfileDockerfileResult,
} from '../agent-runtime.contract';
import type { CreateNoteInput, DeleteNoteInput, NoteResult } from '../notes.contract';
import type { WorkspaceResult } from '../workspaces.contract';

export type DesktopUnsubscribe = () => void;

export type DesktopApi = {
  appInfo: {
    get: () => Promise<AppInfoResult>;
  };
  workspaces: {
    pick: () => Promise<WorkspaceResult | null>;
    list: () => Promise<WorkspaceResult[]>;
  };
  agentRuns: {
    start: (input: StartAgentRunInput) => Promise<AgentRunResult>;
    list: (input?: ListAgentRunsInput) => Promise<AgentRunResult[]>;
    get: (input: GetAgentRunInput) => Promise<AgentRunDetailResult>;
    getCommitDetails: (input: GetAgentRunCommitDetailsInput) => Promise<AgentRunCommitDetail>;
    getCommitFileDiff: (input: GetAgentRunCommitFileDiffInput) => Promise<AgentRunCommitFileDiff>;
    cancel: (input: CancelAgentRunInput) => Promise<void>;
    onEvent: (
      input: WatchAgentRunInput,
      callback: (event: AgentRunEventResult) => void,
    ) => DesktopUnsubscribe;
  };
  agentRuntime: {
    listProfiles: () => Promise<AgentRuntimeProfileResult[]>;
    getProfile: (input: GetAgentRuntimeProfileInput) => Promise<AgentRuntimeProfileResult>;
    updateProfile: (
      input: UpdateAgentRuntimeProfileInput,
    ) => Promise<AgentRuntimeProfileResult>;
    duplicateStarterProfile: (
      input?: DuplicateStarterRuntimeProfileInput,
    ) => Promise<AgentRuntimeProfileResult>;
    getProfileDockerfile: (
      input: RuntimeProfileDockerfileInput,
    ) => Promise<RuntimeProfileDockerfileResult>;
    updateProfileDockerfile: (
      input: UpdateRuntimeProfileDockerfileInput,
    ) => Promise<UpdateRuntimeProfileDockerfileResult>;
    resetProfileDockerfile: (
      input: RuntimeProfileDockerfileInput,
    ) => Promise<UpdateRuntimeProfileDockerfileResult>;
    openProfileFolder: (input: RuntimeProfileDockerfileInput) => Promise<void>;
    getImageStatus: (input: RuntimeProfileImageInput) => Promise<DockerImageStatusResult>;
    buildImage: (input: RuntimeProfileImageInput) => Promise<DockerImageBuildResult>;
    onBuildEvent: (
      callback: (event: DockerImageBuildEventResult) => void,
    ) => DesktopUnsubscribe;
  };
  notes: {
    list: () => Promise<NoteResult[]>;
    create: (input: CreateNoteInput) => Promise<NoteResult>;
    delete: (input: DeleteNoteInput) => Promise<void>;
  };
};
