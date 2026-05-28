import { describe, expect, it } from 'vitest';
import { startAgentRun } from '../start-agent-run';
import type {
  AgentRun,
  AgentRunCommit,
  AgentRunEvent,
  AgentRunRepository,
  AgentRunStatus,
  CreateAgentRunInput,
  AgentRunner,
} from '../../../domain';
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
    this.workspace = { ...this.workspace, ...input };
    return this.workspace;
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

  async start(
    input: Parameters<AgentRunner['start']>[0],
    callbacks: Parameters<AgentRunner['start']>[1],
  ): Promise<void> {
    this.started = true;
    await callbacks.onStatus('running');
    await callbacks.onEvent({
      runId: input.run.id,
      type: 'log',
      message: 'agent output',
      createdAt: 200,
    });
    await callbacks.onCommit('abc123');
    await callbacks.onStatus('succeeded');
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

describe('agent run use-cases', () => {
  it('creates a run, starts the runner, and records events', async () => {
    const runRepository = new FakeRunRepository();
    const published: AgentRunEvent[] = [];

    const run = await startAgentRun(
      {
        workspaceId: 'workspace-1',
        runtimeProfileId: 'profile-1',
        provider: 'claude-code',
        model: 'claude-opus-4-7',
        prompt: 'Implement feature',
      },
      {
        agentRunRepository: runRepository,
        agentRunner: new FakeRunner(),
        workspaceRepository: new FakeWorkspaceRepository(),
        profileRepository: new FakeProfileRepository(),
        dockerImageBuilder: new FakeDockerImageBuilder(),
        validateRuntimeProfile: () => undefined,
        createId: () => `id-${published.length + runRepository.events.length}`,
        createLogFilePath: (runId) => `/logs/${runId}.log`,
        publishEvent: (event) => published.push(event),
        now: () => 123,
      },
    );

    expect(run.branchName).toMatch(/^agentic\/id-0-implement-feature/);
    expect((await runRepository.getRun(run.id))?.status).toBe('succeeded');
    expect(runRepository.commits).toEqual([
      { runId: run.id, sha: 'abc123', createdAt: 123 },
    ]);
    expect(runRepository.events.map((event) => event.type)).toEqual([
      'status',
      'log',
      'commit',
      'status',
    ]);
    expect(published).toHaveLength(4);
  });

  it('rejects missing sandbox images before creating a run', async () => {
    const runRepository = new FakeRunRepository();
    const runner = new FakeRunner();
    const dockerImageBuilder = new FakeDockerImageBuilder();
    dockerImageBuilder.available = false;

    await expect(
      startAgentRun(
        {
          workspaceId: 'workspace-1',
          runtimeProfileId: 'profile-1',
          provider: 'codex',
          model: 'gpt-5.4',
          prompt: 'Implement feature',
        },
        {
          agentRunRepository: runRepository,
          agentRunner: runner,
          workspaceRepository: new FakeWorkspaceRepository(),
          profileRepository: new FakeProfileRepository(),
          dockerImageBuilder,
          validateRuntimeProfile: () => undefined,
          createId: () => 'run-1',
          createLogFilePath: (runId) => `/logs/${runId}.log`,
          publishEvent: () => undefined,
          now: () => 123,
        },
      ),
    ).rejects.toThrow('Sandbox image is not available. Build it first.');

    expect(await runRepository.listRuns()).toEqual([]);
    expect(runner.started).toBe(false);
  });
});
