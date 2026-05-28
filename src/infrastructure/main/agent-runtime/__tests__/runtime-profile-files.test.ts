import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { shell } from 'electron';
import type { AgentRuntimeProfile } from '@/core/agent-runtime/domain';
import { RuntimeProfileFiles } from '../runtime-profile-files';

vi.mock('electron', () => ({
  shell: {
    openPath: vi.fn(async () => ''),
  },
}));

const starterProfile: AgentRuntimeProfile = {
  id: 'starter',
  name: 'Starter',
  sourceKind: 'bundled-starter',
  profilePath: null,
  imageName: 'agentic:starter',
  claudeAuthMountEnabled: false,
  codexAuthMountEnabled: false,
  createdAt: 1,
  updatedAt: 1,
};

describe('RuntimeProfileFiles', () => {
  let tempPath: string;
  let userDataPath: string;
  let resourcesPath: string;
  let files: RuntimeProfileFiles;

  beforeEach(() => {
    tempPath = fs.mkdtempSync(path.join(os.tmpdir(), 'runtime-profile-files-'));
    userDataPath = path.join(tempPath, 'userData');
    resourcesPath = path.join(tempPath, 'resources');
    fs.mkdirSync(path.join(resourcesPath, 'sandcastle'), { recursive: true });
    fs.writeFileSync(path.join(resourcesPath, 'sandcastle', 'Dockerfile'), 'FROM starter\n');
    files = new RuntimeProfileFiles({
      userDataPath,
      resourcesPath,
      isPackaged: true,
    });
    vi.mocked(shell.openPath).mockClear();
  });

  afterEach(() => {
    fs.rmSync(tempPath, { recursive: true, force: true });
  });

  it('reads bundled starter Dockerfile as read-only', () => {
    expect(files.readDockerfile(starterProfile)).toEqual({
      content: 'FROM starter\n',
      editable: false,
      path: path.join(resourcesPath, 'sandcastle', 'Dockerfile'),
    });
  });

  it('rejects writes, resets, and folder opens for starter', async () => {
    expect(() => files.writeDockerfile(starterProfile, 'FROM custom\n')).toThrow(
      'Starter Dockerfile is read-only.',
    );
    expect(() => files.resetDockerfile(starterProfile)).toThrow(
      'Starter Dockerfile cannot be reset.',
    );
    await expect(files.openProfileFolder(starterProfile)).rejects.toThrow(
      'Starter has no editable profile folder.',
    );
  });

  it('reads, writes, resets, and opens copied profile Dockerfiles', async () => {
    const profile = createCopyProfile(files.copyStarterProfile('copy-1'));

    expect(files.readDockerfile(profile)).toEqual({
      content: 'FROM starter\n',
      editable: true,
      path: path.join(profile.profilePath as string, 'Dockerfile'),
    });

    expect(files.writeDockerfile(profile, 'FROM custom\n')).toBe('FROM custom\n');
    expect(files.readDockerfile(profile).content).toBe('FROM custom\n');
    expect(files.resetDockerfile(profile)).toBe('FROM starter\n');
    expect(files.readDockerfile(profile).content).toBe('FROM starter\n');

    await files.openProfileFolder(profile);
    expect(shell.openPath).toHaveBeenCalledWith(profile.profilePath);
  });

  it('rejects invalid copied profile folders and Dockerfiles', () => {
    expect(() => files.readDockerfile(createCopyProfile(null))).toThrow(
      'Runtime profile folder is missing.',
    );

    const outsidePath = path.join(tempPath, 'outside');
    fs.mkdirSync(outsidePath, { recursive: true });
    fs.writeFileSync(path.join(outsidePath, 'Dockerfile'), 'FROM outside\n');
    expect(() => files.readDockerfile(createCopyProfile(outsidePath))).toThrow(
      'Runtime profile folder is outside the managed profile directory.',
    );

    const missingFolderPath = path.join(userDataPath, 'agent-runtime-profiles', 'missing');
    expect(() => files.readDockerfile(createCopyProfile(missingFolderPath))).toThrow(
      'Runtime profile folder not found.',
    );

    const missingDockerfilePath = path.join(userDataPath, 'agent-runtime-profiles', 'no-dockerfile');
    fs.mkdirSync(missingDockerfilePath, { recursive: true });
    expect(() => files.readDockerfile(createCopyProfile(missingDockerfilePath))).toThrow(
      'Runtime Dockerfile not found.',
    );

    const realFolderPath = files.copyStarterProfile('real-copy');
    const linkedFolderPath = path.join(userDataPath, 'agent-runtime-profiles', 'linked-copy');
    fs.symlinkSync(realFolderPath, linkedFolderPath, 'dir');
    expect(() => files.readDockerfile(createCopyProfile(linkedFolderPath))).toThrow(
      'Runtime profile folder resolves outside the managed profile directory.',
    );

    const linkedDockerfileFolder = path.join(
      userDataPath,
      'agent-runtime-profiles',
      'linked-dockerfile',
    );
    fs.mkdirSync(linkedDockerfileFolder, { recursive: true });
    fs.symlinkSync(
      path.join(resourcesPath, 'sandcastle', 'Dockerfile'),
      path.join(linkedDockerfileFolder, 'Dockerfile'),
    );
    expect(() => files.readDockerfile(createCopyProfile(linkedDockerfileFolder))).toThrow(
      'Runtime Dockerfile resolves outside the expected path.',
    );
  });
});

function createCopyProfile(profilePath: string | null): AgentRuntimeProfile {
  return {
    ...starterProfile,
    id: 'copy-1',
    name: 'Copy',
    sourceKind: 'user-managed-copy',
    profilePath,
    imageName: 'agentic:copy-1',
  };
}
