import { describe, expect, it } from 'vitest';
import type {
  AgentRuntimeProfile,
  AgentRuntimeProfileRepository,
  BuildDockerImageInput,
  CreateAgentRuntimeProfile,
  DockerImageBuildEvent,
  DockerImageBuilder,
  DockerImageBuildResult,
  DockerImageStatus,
  UpdateAgentRuntimeProfile,
} from '@/core/agent-runtime/domain';
import { AppError } from '@/shared/app-errors';
import { createAgentRuntimeIpcHandlers } from '../register-agent-runtime-ipc';

class FakeProfileRepository implements AgentRuntimeProfileRepository {
  profiles = new Map<string, AgentRuntimeProfile>([
    ['starter', {
      id: 'starter',
      name: 'Starter',
      sourceKind: 'bundled-starter',
      profilePath: null,
      imageName: 'agentic:starter',
      claudeAuthMountEnabled: false,
      codexAuthMountEnabled: false,
      createdAt: 1,
      updatedAt: 1,
    }],
  ]);

  async listProfiles(): Promise<AgentRuntimeProfile[]> {
    return [...this.profiles.values()];
  }

  async getProfile(id: string): Promise<AgentRuntimeProfile | null> {
    return this.profiles.get(id) ?? null;
  }

  async createProfile(
    input: CreateAgentRuntimeProfile,
    timestamps: { createdAt: number; updatedAt: number },
  ): Promise<AgentRuntimeProfile> {
    const profile = { ...input, ...timestamps };
    this.profiles.set(profile.id, profile);
    return profile;
  }

  async updateProfile(
    id: string,
    input: UpdateAgentRuntimeProfile,
    updatedAt: number,
  ): Promise<AgentRuntimeProfile> {
    const current = this.profiles.get(id);

    if (!current) {
      throw new Error('Runtime profile not found.');
    }

    const next = { ...current, ...input, updatedAt };
    this.profiles.set(id, next);
    return next;
  }
}

class FakeDockerImageBuilder implements DockerImageBuilder {
  available = true;
  buildStarted = 0;
  resolveBuild: ((value: DockerImageBuildResult) => void) | null = null;

  async getImageStatus(input: BuildDockerImageInput, checkedAt: number): Promise<DockerImageStatus> {
    return {
      imageName: input.imageName,
      available: this.available,
      checkedAt,
      errorMessage: this.available ? undefined : 'Image not found locally.',
    };
  }

  buildImage(
    input: BuildDockerImageInput,
    onEvent: (event: DockerImageBuildEvent) => void,
  ): Promise<DockerImageBuildResult> {
    this.buildStarted += 1;
    onEvent({ type: 'log', message: `${input.sourceKind}:${input.imageName}`, createdAt: 123 });

    return new Promise((resolve) => {
      this.resolveBuild = resolve;
    }).then(() => ({ imageName: input.imageName, succeeded: true }));
  }
}

class FakeRuntimeProfileFiles {
  contents = new Map<string, string>([
    ['starter', 'FROM starter\n'],
    ['copy-1', 'FROM starter\n'],
  ]);
  openedProfileIds: string[] = [];

  readDockerfile(profile: AgentRuntimeProfile) {
    return {
      profileId: profile.id,
      content: this.contents.get(profile.id) ?? '',
      editable: profile.sourceKind === 'user-managed-copy',
      path: profile.profilePath ? `${profile.profilePath}/Dockerfile` : '/resources/sandcastle/Dockerfile',
    };
  }

  writeDockerfile(profile: AgentRuntimeProfile, content: string): string {
    if (profile.sourceKind === 'bundled-starter') {
      throw new Error('Starter Dockerfile is read-only.');
    }

    this.contents.set(profile.id, content);
    return content;
  }

  resetDockerfile(profile: AgentRuntimeProfile): string {
    if (profile.sourceKind === 'bundled-starter') {
      throw new Error('Starter Dockerfile cannot be reset.');
    }

    const content = this.contents.get('starter') ?? '';
    this.contents.set(profile.id, content);
    return content;
  }

  async openProfileFolder(profile: AgentRuntimeProfile): Promise<void> {
    if (profile.sourceKind === 'bundled-starter') {
      throw new Error('Starter has no editable profile folder.');
    }

    this.openedProfileIds.push(profile.id);
  }
}

describe('agent runtime IPC handlers', () => {
  it('lists profiles and returns Docker image status for the selected profile', async () => {
    const handlers = createHandlers();

    await expect(handlers.listProfiles()).resolves.toHaveLength(1);
    await expect(handlers.getImageStatus(null, { profileId: 'starter' })).resolves.toEqual({
      imageName: 'agentic:starter',
      available: true,
      checkedAt: 123,
    });
  });

  it('returns unavailable image status with a message', async () => {
    const dockerImageBuilder = new FakeDockerImageBuilder();
    dockerImageBuilder.available = false;
    const handlers = createHandlers({ dockerImageBuilder });

    await expect(handlers.getImageStatus(null, { profileId: 'starter' })).resolves.toEqual({
      imageName: 'agentic:starter',
      available: false,
      checkedAt: 123,
      errorMessage: 'Image not found locally.',
    });
  });

  it('duplicates starter profiles into user-managed copies', async () => {
    const profileRepository = new FakeProfileRepository();
    const handlers = createHandlers({
      profileRepository,
      copyStarterProfile: (profileId) => `/profiles/${profileId}`,
    });

    const profile = await handlers.duplicateStarterProfile(null, { name: 'Toolchain' });

    expect(profile).toMatchObject({
      name: 'Toolchain',
      sourceKind: 'user-managed-copy',
      profilePath: `/profiles/${profile.id}`,
      claudeAuthMountEnabled: false,
      codexAuthMountEnabled: false,
    });
    expect(await profileRepository.listProfiles()).toHaveLength(2);
  });

  it('reads, writes, resets, and opens selected profile Dockerfiles', async () => {
    const profileRepository = new FakeProfileRepository();
    const runtimeProfileFiles = new FakeRuntimeProfileFiles();
    profileRepository.profiles.set('copy-1', {
      ...(profileRepository.profiles.get('starter') as AgentRuntimeProfile),
      id: 'copy-1',
      name: 'Copy',
      sourceKind: 'user-managed-copy',
      profilePath: '/profiles/copy-1',
      imageName: 'agentic:copy-1',
    });
    const handlers = createHandlers({ profileRepository, runtimeProfileFiles });

    await expect(handlers.getProfileDockerfile(null, { profileId: 'starter' })).resolves.toEqual({
      profileId: 'starter',
      content: 'FROM starter\n',
      editable: false,
      path: '/resources/sandcastle/Dockerfile',
    });
    await expect(handlers.updateProfileDockerfile(null, {
      profileId: 'starter',
      content: 'FROM blocked\n',
    })).rejects.toThrow('Starter Dockerfile is read-only.');
    await expect(handlers.updateProfileDockerfile(null, {
      profileId: 'copy-1',
      content: 'FROM custom\n',
    })).resolves.toEqual({
      profileId: 'copy-1',
      content: 'FROM custom\n',
      savedAt: 123,
    });
    await expect(handlers.resetProfileDockerfile(null, { profileId: 'copy-1' })).resolves.toEqual({
      profileId: 'copy-1',
      content: 'FROM starter\n',
      savedAt: 123,
    });

    await handlers.openProfileFolder(null, { profileId: 'copy-1' });
    expect(runtimeProfileFiles.openedProfileIds).toEqual(['copy-1']);
  });

  it('validates auth before updating profiles', async () => {
    const handlers = createHandlers({
      validateRuntimeProfile: (profile) => {
        if (profile.claudeAuthMountEnabled) {
          throw new AppError('AUTH_MISSING', 'Claude CLI auth directory not found.');
        }
      },
    });

    await expect(handlers.updateProfile(null, {
      id: 'starter',
      claudeAuthMountEnabled: true,
    })).rejects.toMatchObject({
      code: 'AUTH_MISSING',
      message: 'Claude CLI auth directory not found.',
    });
  });

  it('publishes build events and rejects parallel builds', async () => {
    const dockerImageBuilder = new FakeDockerImageBuilder();
    const events: Array<DockerImageBuildEvent & { profileId: string }> = [];
    const handlers = createHandlers({
      dockerImageBuilder,
      publishBuildEvent: (event) => events.push(event),
    });

    const build = handlers.buildImage(null, { profileId: 'starter' });
    await expect(handlers.buildImage(null, { profileId: 'starter' })).rejects.toMatchObject({
      code: 'BUILD_ALREADY_ACTIVE',
      message: 'Docker image build is already running.',
    });
    dockerImageBuilder.resolveBuild?.({ imageName: 'agentic:starter', succeeded: true });

    await expect(build).resolves.toEqual({ imageName: 'agentic:starter', succeeded: true });
    expect(events).toEqual([{
      profileId: 'starter',
      type: 'log',
      message: 'bundled-starter:agentic:starter',
      createdAt: 123,
    }]);
    expect(dockerImageBuilder.buildStarted).toBe(1);
  });
});

function createHandlers(overrides: Partial<Parameters<typeof createAgentRuntimeIpcHandlers>[0]> = {}) {
  return createAgentRuntimeIpcHandlers({
    dockerImageBuilder: new FakeDockerImageBuilder(),
    profileRepository: new FakeProfileRepository(),
    copyStarterProfile: (profileId) => `/profiles/${profileId}`,
    runtimeProfileFiles: new FakeRuntimeProfileFiles(),
    validateRuntimeProfile: () => undefined,
    publishBuildEvent: () => undefined,
    now: () => 123,
    ...overrides,
  });
}
