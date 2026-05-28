import { execFile } from 'node:child_process';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalDockerImageBuilder } from '../docker-image-builder';

vi.mock('node:child_process', () => ({
  execFile: vi.fn(),
  spawn: vi.fn(),
}));

const execFileMock = vi.mocked(execFile);

describe('LocalDockerImageBuilder', () => {
  beforeEach(() => {
    execFileMock.mockReset();
  });

  it('reports an existing Docker image as available', async () => {
    execFileMock.mockImplementation((...args: unknown[]) => {
      const callback = args[3] as (error: Error | null, stdout: string, stderr: string) => void;
      callback(null, '{}', '');
      return undefined as never;
    });

    await expect(createBuilder().getImageStatus(runtimeImageInput(), 123)).resolves.toEqual({
      imageName: 'agentic:test',
      available: true,
      checkedAt: 123,
    });
  });

  it('reports a missing Docker image as unavailable', async () => {
    execFileMock.mockImplementation((...args: unknown[]) => {
      const callback = args[3] as (error: Error | null, stdout: string, stderr: string) => void;
      callback(
        new Error('Command failed'),
        '',
        'Error response from daemon: No such image: agentic:test',
      );
      return undefined as never;
    });

    await expect(createBuilder().getImageStatus(runtimeImageInput(), 123)).resolves.toEqual({
      imageName: 'agentic:test',
      available: false,
      checkedAt: 123,
      errorMessage: 'Image not found locally.',
    });
  });

  it('reports Docker errors as unavailable with the Docker message', async () => {
    execFileMock.mockImplementation((...args: unknown[]) => {
      const callback = args[3] as (error: Error | null, stdout: string, stderr: string) => void;
      callback(new Error('spawn docker ENOENT'), '', '');
      return undefined as never;
    });

    await expect(createBuilder().getImageStatus(runtimeImageInput(), 123)).resolves.toEqual({
      imageName: 'agentic:test',
      available: false,
      checkedAt: 123,
      errorMessage: 'spawn docker ENOENT',
    });
  });
});

function createBuilder(): LocalDockerImageBuilder {
  return new LocalDockerImageBuilder({
    userDataPath: '/tmp/agentic',
    resourcesPath: '/tmp/resources',
    isPackaged: false,
  });
}

function runtimeImageInput() {
  return {
    imageName: 'agentic:test',
    sourceKind: 'bundled-starter' as const,
    profilePath: null,
  };
}
