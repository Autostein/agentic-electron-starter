import { execFile, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type {
  BuildDockerImageInput,
  DockerImageBuildEvent,
  DockerImageBuilder,
  DockerImageBuildResult,
  DockerImageStatus,
} from '@/core/agent-runtime/domain';
import { AppError } from '@/shared/app-errors';
import { RuntimeProfileFiles } from '../agent-runtime/runtime-profile-files';

export type LocalDockerImageBuilderOptions = {
  userDataPath: string;
  resourcesPath: string;
  isPackaged: boolean;
};

export class LocalDockerImageBuilder implements DockerImageBuilder {
  private readonly options: LocalDockerImageBuilderOptions;

  constructor(options: LocalDockerImageBuilderOptions) {
    this.options = options;
  }

  getImageStatus(input: BuildDockerImageInput, checkedAt: number): Promise<DockerImageStatus> {
    return new Promise((resolve) => {
      execFile('docker', ['image', 'inspect', input.imageName], { encoding: 'utf8' }, (error, _stdout, stderr) => {
        if (!error) {
          resolve({
            imageName: input.imageName,
            available: true,
            checkedAt,
          });
          return;
        }

        resolve({
          imageName: input.imageName,
          available: false,
          checkedAt,
          ...toDockerStatus(error, stderr),
        });
      });
    });
  }

  buildImage(
    input: BuildDockerImageInput,
    onEvent: (event: DockerImageBuildEvent) => void,
  ): Promise<DockerImageBuildResult> {
    const contextPath = this.resolveBuildContext(input);
    const args = [
      'build',
      '--build-arg',
      `AGENT_UID=${process.getuid?.() ?? 1000}`,
      '--build-arg',
      `AGENT_GID=${process.getgid?.() ?? 1000}`,
      '-t',
      input.imageName,
      contextPath,
    ];

    onEvent({ type: 'log', message: `docker ${args.join(' ')}`, createdAt: Date.now() });

    return new Promise((resolve, reject) => {
      const child = spawn('docker', args, { cwd: contextPath, stdio: ['ignore', 'pipe', 'pipe'] });

      child.stdout.on('data', (chunk: Buffer) => {
        emitLines(chunk, 'log', onEvent);
      });
      child.stderr.on('data', (chunk: Buffer) => {
        emitLines(chunk, 'log', onEvent);
      });
      child.on('error', (error) => {
        const appError = new AppError(
          'DOCKER_UNAVAILABLE',
          'Docker is unavailable. Start Docker and try again.',
          { details: { cause: error.message } },
        );
        onEvent({ type: 'error', message: appError.message, createdAt: Date.now() });
        reject(appError);
      });
      child.on('close', (code) => {
        if (code === 0) {
          onEvent({
            type: 'complete',
            message: `Built ${input.imageName}`,
            createdAt: Date.now(),
          });
          resolve({ imageName: input.imageName, succeeded: true });
          return;
        }

        const error = new AppError(
          'DOCKER_UNAVAILABLE',
          `Docker image build failed with exit code ${code ?? 'unknown'}.`,
        );
        onEvent({ type: 'error', message: error.message, createdAt: Date.now() });
        reject(error);
      });
    });
  }

  private resolveBuildContext(input: BuildDockerImageInput): string {
    if (input.sourceKind === 'user-managed-copy') {
      if (!input.profilePath || !fs.existsSync(input.profilePath)) {
        throw new AppError('NOT_FOUND', 'Runtime profile folder is missing.');
      }

      return input.profilePath;
    }

    const targetPath = path.join(this.options.userDataPath, 'sandcastle');
    const files = new RuntimeProfileFiles(this.options);

    fs.mkdirSync(targetPath, { recursive: true });
    fs.cpSync(files.resolveBundledAssetsPath(), targetPath, {
      recursive: true,
      force: true,
    });

    return targetPath;
  }
}

function toDockerStatus(
  error: Error & { code?: unknown },
  stderr: string | Buffer,
): {
  errorMessage: string;
  errorCode: 'DOCKER_UNAVAILABLE' | 'IMAGE_MISSING';
} {
  const output = stderr.toString().trim();

  if (output.includes('No such image')) {
    return {
      errorMessage: 'Image not found locally.',
      errorCode: 'IMAGE_MISSING',
    };
  }

  return {
    errorMessage: output || (error.code === 'ENOENT'
      ? 'Docker is unavailable. Start Docker and try again.'
      : error.message),
    errorCode: 'DOCKER_UNAVAILABLE',
  };
}

function emitLines(
  chunk: Buffer,
  type: DockerImageBuildEvent['type'],
  onEvent: (event: DockerImageBuildEvent) => void,
): void {
  for (const line of chunk.toString().split(/\r?\n/)) {
    if (line.trim()) {
      onEvent({ type, message: line, createdAt: Date.now() });
    }
  }
}
