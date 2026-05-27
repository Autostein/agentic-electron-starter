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
  AgentRuntimeSettings,
  AgentRuntimeSettingsRepository,
  DockerImageBuildEvent,
  DockerImageBuilder,
  DockerImageBuildResult,
  DockerImageStatus,
} from '@/core/agent-runtime/domain';
import type { Project, ProjectInput, ProjectRepository } from '@/core/projects/domain';

class FakeProjectRepository implements ProjectRepository {
  project: Project = {
    id: 'project-1',
    path: '/repo',
    name: 'repo',
    currentBranch: 'main',
    createdAt: 1,
    updatedAt: 1,
  };

  async listProjects(): Promise<Project[]> {
    return [this.project];
  }

  async getProject(id: string): Promise<Project | null> {
    return id === this.project.id ? this.project : null;
  }

  async upsertProject(input: ProjectInput): Promise<Project> {
    this.project = { ...this.project, ...input };
    return this.project;
  }
}

class FakeSettingsRepository implements AgentRuntimeSettingsRepository {
  settings: AgentRuntimeSettings = {
    dockerImageName: 'agentic:test',
    claudeDefaultModel: 'claude-opus-4-7',
    codexDefaultModel: 'gpt-5.4',
    claudeAuthMountEnabled: true,
    claudeAuthHostPath: '/home/me/.claude',
    codexAuthMountEnabled: true,
    codexAuthHostPath: '/home/me/.codex',
    updatedAt: 1,
  };

  async getSettings(): Promise<AgentRuntimeSettings> {
    return this.settings;
  }

  async updateSettings(): Promise<AgentRuntimeSettings> {
    return this.settings;
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

  async getImageStatus(input: { imageName: string }, checkedAt: number): Promise<DockerImageStatus> {
    return {
      imageName: input.imageName,
      available: this.available,
      checkedAt,
      errorMessage: this.available ? undefined : 'Image not found locally.',
    };
  }

  async buildImage(
    input: { imageName: string },
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
        projectId: 'project-1',
        provider: 'claude-code',
        model: 'claude-opus-4-7',
        prompt: 'Implement feature',
      },
      {
        agentRunRepository: runRepository,
        agentRunner: new FakeRunner(),
        projectRepository: new FakeProjectRepository(),
        settingsRepository: new FakeSettingsRepository(),
        dockerImageBuilder: new FakeDockerImageBuilder(),
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
          projectId: 'project-1',
          provider: 'codex',
          model: 'gpt-5.4',
          prompt: 'Implement feature',
        },
        {
          agentRunRepository: runRepository,
          agentRunner: runner,
          projectRepository: new FakeProjectRepository(),
          settingsRepository: new FakeSettingsRepository(),
          dockerImageBuilder,
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
