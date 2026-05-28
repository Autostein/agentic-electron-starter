import { describe, expect, it } from 'vitest';
import type {
  AgentRunCommitDetail,
  AgentRunCommitFileDiff,
  AgentRunCommitSummary,
} from '@/core/agent-runs/application/read-models/commit-diff';
import type { GitCommitReadService } from '@/core/agent-runs/application/ports/git-commit-read-service';
import type {
  AgentRun,
  AgentRunCommit,
  AgentRunEvent,
  AgentRunRepository,
  AgentRunStatus,
  CreateAgentRunInput,
  AgentRunner,
} from '@/core/agent-runs/domain';
import type {
  AgentRuntimeProfile,
  AgentRuntimeProfileRepository,
  BuildDockerImageInput,
  DockerImageBuildEvent,
  DockerImageBuilder,
  DockerImageBuildResult,
  DockerImageStatus,
} from '@/core/agent-runtime/domain';
import type { Workspace, WorkspaceInput, WorkspaceRepository } from '@/core/workspaces/domain';
import { createAgentRunsIpcHandlers } from '../register-agent-runs-ipc';

class FakeWorkspaceRepository implements WorkspaceRepository {
  workspace: Workspace = {
    id: 'workspace-1',
    path: '/repo',
    name: 'repo',
    currentBranch: 'main',
      createdAt: 1,
    updatedAt: 1,
  };

  async listWorkspaces(): Promise<Workspace[]> {
    return [this.workspace];
  }

  async getWorkspace(id: string): Promise<Workspace | null> {
    return id === this.workspace.id ? this.workspace : null;
  }

  async upsertWorkspace(input: WorkspaceInput): Promise<Workspace> {
    return { ...this.workspace, ...input };
  }
}

class FakeProfileRepository implements AgentRuntimeProfileRepository {
  profile: AgentRuntimeProfile = {
    id: 'profile-1',
    name: 'Starter',
    sourceKind: 'bundled-starter',
    profilePath: null,
    imageName: 'agentic:test',
    claudeDefaultModel: 'claude-opus-4-7',
    codexDefaultModel: 'gpt-5.4',
    claudeAuthMountEnabled: false,
    codexAuthMountEnabled: false,
      createdAt: 1,
    updatedAt: 1,
  };

  async listProfiles(): Promise<AgentRuntimeProfile[]> {
    return [this.profile];
  }

  async getProfile(id: string): Promise<AgentRuntimeProfile | null> {
    return id === this.profile.id ? this.profile : null;
  }

  async createProfile(): Promise<AgentRuntimeProfile> {
    return this.profile;
  }

  async updateProfile(): Promise<AgentRuntimeProfile> {
    return this.profile;
  }
}

class FakeRunRepository implements AgentRunRepository {
  runs = new Map<string, AgentRun>();
  events: AgentRunEvent[] = [];
  commits: AgentRunCommit[] = [];

  async createRun(input: CreateAgentRunInput): Promise<AgentRun> {
    const run: AgentRun = {
      ...input,
      status: 'queued',
      startedAt: null,
      finishedAt: null,
      errorMessage: null,
    };
    this.runs.set(run.id, run);
    return run;
  }

  async getRun(id: string): Promise<AgentRun | null> {
    return this.runs.get(id) ?? null;
  }

  async listRuns(): Promise<AgentRun[]> {
    return [...this.runs.values()];
  }

  async updateRunStatus(
    id: string,
    status: AgentRunStatus,
    timestamps: { startedAt?: number | null; finishedAt?: number | null; errorMessage?: string | null },
  ): Promise<void> {
    const run = this.runs.get(id);
    if (run) {
      this.runs.set(id, { ...run, ...timestamps, status });
    }
  }

  async appendEvent(event: AgentRunEvent): Promise<void> {
    this.events.push(event);
  }

  async listEvents(): Promise<AgentRunEvent[]> {
    return this.events;
  }

  async appendCommit(commit: AgentRunCommit): Promise<void> {
    this.commits.push(commit);
  }

  async listCommits(): Promise<AgentRunCommit[]> {
    return this.commits;
  }
}

class FakeRunner implements AgentRunner {
  started = false;

  async start(): Promise<void> {
    this.started = true;
  }

  async cancel(): Promise<void> {}
}

class FakeDockerImageBuilder implements DockerImageBuilder {
  available = true;

  async getImageStatus(input: BuildDockerImageInput, checkedAt: number): Promise<DockerImageStatus> {
    return {
      imageName: input.imageName,
      available: this.available,
      checkedAt,
      errorMessage: this.available ? undefined : 'Image not found locally.',
    };
  }

  async buildImage(
    input: BuildDockerImageInput,
    _onEvent: (event: DockerImageBuildEvent) => void,
  ): Promise<DockerImageBuildResult> {
    return { imageName: input.imageName, succeeded: true };
  }
}

class FakeGitCommitReadService implements GitCommitReadService {
  async getCommitSummary(input: { commit: AgentRunCommit }): Promise<AgentRunCommitSummary> {
    return {
      ...input.commit,
      shortSha: input.commit.sha.slice(0, 7),
      subject: 'Commit subject',
      filesChanged: 1,
      additions: 2,
      deletions: 1,
      unavailable: false,
    };
  }

  async getCommitDetail(input: { runId: string; sha: string }): Promise<AgentRunCommitDetail> {
    return {
      runId: input.runId,
      sha: input.sha,
      shortSha: input.sha.slice(0, 7),
      subject: 'Commit subject',
      authorName: 'Dev',
      authorEmail: 'dev@example.com',
      committedAt: 123,
      filesChanged: 1,
      additions: 1,
      deletions: 0,
      files: [
        {
          oldPath: 'README.md',
          newPath: 'README.md',
          status: 'modified',
          additions: 1,
          deletions: 0,
          isLarge: false,
          hunks: [],
        },
      ],
    };
  }

  async getCommitFileDiff(): Promise<AgentRunCommitFileDiff> {
    return {
      oldPath: 'README.md',
      newPath: 'README.md',
      status: 'modified',
      additions: 1,
      deletions: 0,
      isLarge: false,
      hunks: [],
    };
  }
}

describe('agent run IPC handlers', () => {
  it('validates start input and delegates to the runner', async () => {
    const runner = new FakeRunner();
    const handlers = createAgentRunsIpcHandlers({
      agentRunRepository: new FakeRunRepository(),
      agentRunner: runner,
      gitCommitReadService: new FakeGitCommitReadService(),
      workspaceRepository: new FakeWorkspaceRepository(),
      profileRepository: new FakeProfileRepository(),
      validateRuntimeProfile: () => undefined,
      dockerImageBuilder: new FakeDockerImageBuilder(),
      createLogFilePath: (runId) => `/logs/${runId}.log`,
      publishEvent: () => undefined,
      now: () => 123,
    });

    const run = await handlers.start(null, {
      workspaceId: 'workspace-1',
      runtimeProfileId: 'profile-1',
      provider: 'codex',
      model: 'gpt-5.4',
      prompt: 'Implement it',
    });

    expect(run.status).toBe('queued');
    expect(runner.started).toBe(true);
  });

  it('rejects invalid provider payloads', async () => {
    const handlers = createAgentRunsIpcHandlers({
      agentRunRepository: new FakeRunRepository(),
      agentRunner: new FakeRunner(),
      gitCommitReadService: new FakeGitCommitReadService(),
      workspaceRepository: new FakeWorkspaceRepository(),
      profileRepository: new FakeProfileRepository(),
      validateRuntimeProfile: () => undefined,
      dockerImageBuilder: new FakeDockerImageBuilder(),
      createLogFilePath: (runId) => `/logs/${runId}.log`,
      publishEvent: () => undefined,
      now: () => 123,
    });

    await expect(
      handlers.start(null, {
        workspaceId: 'workspace-1',
        runtimeProfileId: 'profile-1',
        provider: 'bad-provider',
        model: 'model',
        prompt: 'Prompt',
      }),
    ).rejects.toThrow();
  });

  it('rejects start when the sandbox image is missing', async () => {
    const runner = new FakeRunner();
    const dockerImageBuilder = new FakeDockerImageBuilder();
    dockerImageBuilder.available = false;
    const runRepository = new FakeRunRepository();
    const handlers = createAgentRunsIpcHandlers({
      agentRunRepository: runRepository,
      agentRunner: runner,
      gitCommitReadService: new FakeGitCommitReadService(),
      workspaceRepository: new FakeWorkspaceRepository(),
      profileRepository: new FakeProfileRepository(),
      validateRuntimeProfile: () => undefined,
      dockerImageBuilder,
      createLogFilePath: (runId) => `/logs/${runId}.log`,
      publishEvent: () => undefined,
      now: () => 123,
    });

    await expect(
      handlers.start(null, {
        workspaceId: 'workspace-1',
        runtimeProfileId: 'profile-1',
        provider: 'codex',
        model: 'gpt-5.4',
        prompt: 'Implement it',
      }),
    ).rejects.toThrow('Sandbox image is not available. Build it first.');

    expect(await runRepository.listRuns()).toEqual([]);
    expect(runner.started).toBe(false);
  });

  it('returns commit details for a recorded run commit', async () => {
    const runRepository = new FakeRunRepository();
    runRepository.runs.set('run-1', {
      id: 'run-1',
      workspaceId: 'workspace-1',
      workspacePath: '/repo',
      workspaceName: 'repo',
      runtimeProfileId: 'profile-1',
      runtimeProfileName: 'Starter',
      runtimeImageName: 'agentic:test',
      provider: 'codex',
      model: 'gpt-5.4',
      prompt: 'Prompt',
      maxIterations: 1,
      status: 'succeeded',
      branchName: 'agentic/run-1',
      logFilePath: '/logs/run-1.log',
    createdAt: 1,
      startedAt: 2,
      finishedAt: 3,
      errorMessage: null,
    });
    runRepository.commits.push({ runId: 'run-1', sha: 'abcdef123', createdAt: 3 });
    const handlers = createAgentRunsIpcHandlers({
      agentRunRepository: runRepository,
      agentRunner: new FakeRunner(),
      gitCommitReadService: new FakeGitCommitReadService(),
      workspaceRepository: new FakeWorkspaceRepository(),
      profileRepository: new FakeProfileRepository(),
      validateRuntimeProfile: () => undefined,
      dockerImageBuilder: new FakeDockerImageBuilder(),
      createLogFilePath: (runId) => `/logs/${runId}.log`,
      publishEvent: () => undefined,
      now: () => 123,
    });

    await expect(handlers.getCommitDetails(null, {
      runId: 'run-1',
      sha: 'abcdef123',
    })).resolves.toMatchObject({
      runId: 'run-1',
      sha: 'abcdef123',
      subject: 'Commit subject',
    });
  });

  it('rejects commit details for commits not recorded on the run', async () => {
    const runRepository = new FakeRunRepository();
    runRepository.runs.set('run-1', {
      id: 'run-1',
      workspaceId: 'workspace-1',
      workspacePath: '/repo',
      workspaceName: 'repo',
      runtimeProfileId: 'profile-1',
      runtimeProfileName: 'Starter',
      runtimeImageName: 'agentic:test',
      provider: 'codex',
      model: 'gpt-5.4',
      prompt: 'Prompt',
      maxIterations: 1,
      status: 'succeeded',
      branchName: 'agentic/run-1',
      logFilePath: '/logs/run-1.log',
    createdAt: 1,
      startedAt: 2,
      finishedAt: 3,
      errorMessage: null,
    });
    const handlers = createAgentRunsIpcHandlers({
      agentRunRepository: runRepository,
      agentRunner: new FakeRunner(),
      gitCommitReadService: new FakeGitCommitReadService(),
      workspaceRepository: new FakeWorkspaceRepository(),
      profileRepository: new FakeProfileRepository(),
      validateRuntimeProfile: () => undefined,
      dockerImageBuilder: new FakeDockerImageBuilder(),
      createLogFilePath: (runId) => `/logs/${runId}.log`,
      publishEvent: () => undefined,
      now: () => 123,
    });

    await expect(handlers.getCommitDetails(null, {
      runId: 'run-1',
      sha: 'missing',
    })).rejects.toThrow('Commit is not recorded on this run.');
  });
});
