import { describe, expect, it } from 'vitest';
import type {
  AgentRuntimeSettings,
  AgentRuntimeSettingsRepository,
  DockerImageBuildEvent,
  DockerImageBuilder,
  DockerImageBuildResult,
  DockerImageStatus,
  UpdateAgentRuntimeSettings,
} from '@/core/agent-runtime/domain';
import { createAgentRuntimeIpcHandlers } from '../register-agent-runtime-ipc';

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

  async updateSettings(
    input: UpdateAgentRuntimeSettings,
    updatedAt: number,
  ): Promise<AgentRuntimeSettings> {
    this.settings = { ...this.settings, ...input, updatedAt };
    return this.settings;
  }
}

class FakeDockerImageBuilder implements DockerImageBuilder {
  available = true;
  buildStarted = 0;
  resolveBuild: ((value: DockerImageBuildResult) => void) | null = null;

  async getImageStatus(input: { imageName: string }, checkedAt: number): Promise<DockerImageStatus> {
    return {
      imageName: input.imageName,
      available: this.available,
      checkedAt,
      errorMessage: this.available ? undefined : 'Image not found locally.',
    };
  }

  buildImage(
    input: { imageName: string },
    onEvent: (event: DockerImageBuildEvent) => void,
  ): Promise<DockerImageBuildResult> {
    this.buildStarted += 1;
    onEvent({ type: 'log', message: 'building', createdAt: 123 });

    return new Promise((resolve) => {
      this.resolveBuild = resolve;
    }).then(() => ({ imageName: input.imageName, succeeded: true }));
  }
}

describe('agent runtime IPC handlers', () => {
  it('returns Docker image status for the configured image', async () => {
    const handlers = createAgentRuntimeIpcHandlers({
      dockerImageBuilder: new FakeDockerImageBuilder(),
      settingsRepository: new FakeSettingsRepository(),
      publishBuildEvent: () => undefined,
      now: () => 123,
    });

    await expect(handlers.getImageStatus()).resolves.toEqual({
      imageName: 'agentic:test',
      available: true,
      checkedAt: 123,
    });
  });

  it('returns unavailable image status with a message', async () => {
    const dockerImageBuilder = new FakeDockerImageBuilder();
    dockerImageBuilder.available = false;
    const handlers = createAgentRuntimeIpcHandlers({
      dockerImageBuilder,
      settingsRepository: new FakeSettingsRepository(),
      publishBuildEvent: () => undefined,
      now: () => 123,
    });

    await expect(handlers.getImageStatus()).resolves.toEqual({
      imageName: 'agentic:test',
      available: false,
      checkedAt: 123,
      errorMessage: 'Image not found locally.',
    });
  });

  it('publishes build events and rejects parallel builds', async () => {
    const dockerImageBuilder = new FakeDockerImageBuilder();
    const events: DockerImageBuildEvent[] = [];
    const handlers = createAgentRuntimeIpcHandlers({
      dockerImageBuilder,
      settingsRepository: new FakeSettingsRepository(),
      publishBuildEvent: (event) => events.push(event),
      now: () => 123,
    });

    const build = handlers.buildImage();
    await expect(handlers.buildImage()).rejects.toThrow('Docker image build is already running.');
    dockerImageBuilder.resolveBuild?.({ imageName: 'agentic:test', succeeded: true });

    await expect(build).resolves.toEqual({ imageName: 'agentic:test', succeeded: true });
    expect(events).toEqual([{ type: 'log', message: 'building', createdAt: 123 }]);
    expect(dockerImageBuilder.buildStarted).toBe(1);
  });
});
