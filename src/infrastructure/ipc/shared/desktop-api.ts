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
  AgentRuntimeSettingsResult,
  DockerImageBuildEventResult,
  DockerImageBuildResult,
  DockerImageStatusResult,
  UpdateAgentRuntimeSettingsInput,
} from '../agent-runtime.contract';
import type { CreateNoteInput, DeleteNoteInput, NoteResult } from '../notes.contract';
import type { ProjectResult } from '../projects.contract';

export type DesktopUnsubscribe = () => void;

export type DesktopApi = {
  appInfo: {
    get: () => Promise<AppInfoResult>;
  };
  projects: {
    pick: () => Promise<ProjectResult | null>;
    list: () => Promise<ProjectResult[]>;
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
    getSettings: () => Promise<AgentRuntimeSettingsResult>;
    updateSettings: (
      input: UpdateAgentRuntimeSettingsInput,
    ) => Promise<AgentRuntimeSettingsResult>;
    getImageStatus: () => Promise<DockerImageStatusResult>;
    buildImage: () => Promise<DockerImageBuildResult>;
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
