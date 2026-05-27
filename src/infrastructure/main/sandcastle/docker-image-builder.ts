import { execFile, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type {
  DockerImageBuildEvent,
  DockerImageBuilder,
  DockerImageBuildResult,
  DockerImageStatus,
} from '@/core/agent-runtime/domain';

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

  getImageStatus(input: { imageName: string }, checkedAt: number): Promise<DockerImageStatus> {
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
          errorMessage: toDockerStatusMessage(error, stderr),
        });
      });
    });
  }

  buildImage(
    input: { imageName: string },
    onEvent: (event: DockerImageBuildEvent) => void,
  ): Promise<DockerImageBuildResult> {
    const contextPath = this.prepareBuildContext();
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
        onEvent({ type: 'error', message: error.message, createdAt: Date.now() });
        reject(error);
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

        const error = new Error(`Docker image build failed with exit code ${code ?? 'unknown'}.`);
        onEvent({ type: 'error', message: error.message, createdAt: Date.now() });
        reject(error);
      });
    });
  }

  private prepareBuildContext(): string {
    const targetPath = path.join(this.options.userDataPath, 'sandcastle');

    fs.mkdirSync(targetPath, { recursive: true });
    fs.cpSync(this.resolveBundledAssetsPath(), targetPath, {
      recursive: true,
      force: true,
    });

    return targetPath;
  }

  private resolveBundledAssetsPath(): string {
    return this.options.isPackaged
      ? path.join(this.options.resourcesPath, 'sandcastle')
      : path.join(process.cwd(), 'resources', 'sandcastle');
  }
}

function toDockerStatusMessage(error: Error, stderr: string | Buffer): string {
  const output = stderr.toString().trim();

  if (output.includes('No such image')) {
    return 'Image not found locally.';
  }

  return output || error.message;
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
