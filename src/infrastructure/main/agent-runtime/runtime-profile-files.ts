import fs from 'node:fs';
import path from 'node:path';
import { shell } from 'electron';
import type { AgentRuntimeProfile } from '@/core/agent-runtime/domain';
import { AppError } from '@/shared/app-errors';

export type RuntimeProfileFilesOptions = {
  userDataPath: string;
  resourcesPath: string;
  isPackaged: boolean;
};

export type RuntimeProfileDockerfile = {
  content: string;
  editable: boolean;
  path: string;
};

export class RuntimeProfileFiles {
  private readonly options: RuntimeProfileFilesOptions;

  constructor(options: RuntimeProfileFilesOptions) {
    this.options = options;
  }

  copyStarterProfile(profileId: string): string {
    const targetPath = path.join(this.options.userDataPath, 'agent-runtime-profiles', profileId);

    fs.rmSync(targetPath, { recursive: true, force: true });
    fs.mkdirSync(targetPath, { recursive: true });
    fs.cpSync(this.resolveBundledAssetsPath(), targetPath, {
      recursive: true,
      force: true,
    });

    return targetPath;
  }

  readDockerfile(profile: AgentRuntimeProfile): RuntimeProfileDockerfile {
    const dockerfile = this.resolveDockerfile(profile);

    return {
      content: fs.readFileSync(dockerfile.path, 'utf8'),
      editable: dockerfile.editable,
      path: dockerfile.path,
    };
  }

  writeDockerfile(profile: AgentRuntimeProfile, content: string): string {
    const dockerfile = this.resolveDockerfile(profile);

    if (!dockerfile.editable) {
      throw new AppError('VALIDATION_FAILED', 'Starter Dockerfile is read-only. Duplicate it before editing.');
    }

    fs.writeFileSync(dockerfile.path, content, 'utf8');
    return content;
  }

  resetDockerfile(profile: AgentRuntimeProfile): string {
    const dockerfile = this.resolveDockerfile(profile);

    if (!dockerfile.editable) {
      throw new AppError('VALIDATION_FAILED', 'Starter Dockerfile cannot be reset.');
    }

    const content = fs.readFileSync(this.resolveBundledDockerfilePath(), 'utf8');
    fs.writeFileSync(dockerfile.path, content, 'utf8');
    return content;
  }

  async openProfileFolder(profile: AgentRuntimeProfile): Promise<void> {
    if (profile.sourceKind === 'bundled-starter') {
      throw new AppError('VALIDATION_FAILED', 'Starter has no editable profile folder.');
    }

    const profilePath = this.resolveManagedProfilePath(profile);
    const error = await shell.openPath(profilePath);

    if (error) {
      throw new AppError('UNKNOWN', error);
    }
  }

  resolveBundledAssetsPath(): string {
    return this.options.isPackaged
      ? path.join(this.options.resourcesPath, 'sandcastle')
      : path.join(process.cwd(), 'resources', 'sandcastle');
  }

  private resolveDockerfile(profile: AgentRuntimeProfile): {
    path: string;
    editable: boolean;
  } {
    if (profile.sourceKind === 'bundled-starter') {
      return {
        path: this.assertFile(this.resolveBundledDockerfilePath(), 'Bundled starter Dockerfile not found.'),
        editable: false,
      };
    }

    const profilePath = this.resolveManagedProfilePath(profile);
    const dockerfilePath = this.assertFile(
      path.join(profilePath, 'Dockerfile'),
      'Runtime Dockerfile not found.',
    );

    if (!isInsidePath(fs.realpathSync(profilePath), fs.realpathSync(dockerfilePath))) {
      throw new AppError('VALIDATION_FAILED', 'Runtime Dockerfile resolves outside the expected path.');
    }

    return { path: dockerfilePath, editable: true };
  }

  private resolveBundledDockerfilePath(): string {
    return path.join(this.resolveBundledAssetsPath(), 'Dockerfile');
  }

  private resolveManagedProfilePath(profile: AgentRuntimeProfile): string {
    if (profile.sourceKind !== 'user-managed-copy') {
      throw new AppError('VALIDATION_FAILED', 'Runtime profile is not user-managed.');
    }

    if (!profile.profilePath) {
      throw new AppError('NOT_FOUND', 'Runtime profile folder is missing.');
    }

    const profilesRoot = path.resolve(this.options.userDataPath, 'agent-runtime-profiles');
    const profilePath = path.resolve(profile.profilePath);

    if (!isInsidePath(profilesRoot, profilePath)) {
      throw new AppError('VALIDATION_FAILED', 'Runtime profile folder is outside the managed profile directory.');
    }

    if (!fs.existsSync(profilePath)) {
      throw new AppError('NOT_FOUND', 'Runtime profile folder not found.');
    }

    const profileLinkStat = fs.lstatSync(profilePath);
    const profileStat = fs.statSync(profilePath);

    if (profileLinkStat.isSymbolicLink()) {
      throw new AppError('VALIDATION_FAILED', 'Runtime profile folder resolves outside the managed profile directory.');
    }

    if (!profileStat.isDirectory()) {
      throw new AppError('VALIDATION_FAILED', 'Runtime profile folder is not a directory.');
    }

    const rootRealPath = fs.realpathSync(profilesRoot);
    const profileRealPath = fs.realpathSync(profilePath);

    if (!isInsidePath(rootRealPath, profileRealPath)) {
      throw new AppError('VALIDATION_FAILED', 'Runtime profile folder resolves outside the managed profile directory.');
    }

    return profilePath;
  }

  private assertFile(filePath: string, missingMessage: string): string {
    if (!fs.existsSync(filePath)) {
      throw new AppError('NOT_FOUND', missingMessage);
    }

    const linkStat = fs.lstatSync(filePath);
    const stat = fs.statSync(filePath);

    if (linkStat.isSymbolicLink()) {
      throw new AppError('VALIDATION_FAILED', 'Runtime Dockerfile resolves outside the expected path.');
    }

    if (!stat.isFile()) {
      throw new AppError('VALIDATION_FAILED', 'Runtime Dockerfile path is not a file.');
    }

    return filePath;
  }
}

function isInsidePath(parentPath: string, childPath: string): boolean {
  const relativePath = path.relative(parentPath, childPath);

  return relativePath !== '' && !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
}
