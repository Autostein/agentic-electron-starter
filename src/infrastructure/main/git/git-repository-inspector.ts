import { execFile } from 'node:child_process';
import path from 'node:path';
import type { GitRepositoryInfo, GitRepositoryInspector } from '@/core/projects/domain';

export class LocalGitRepositoryInspector implements GitRepositoryInspector {
  async inspect(repoPath: string): Promise<GitRepositoryInfo> {
    const root = await runGit(repoPath, ['rev-parse', '--show-toplevel']);
    const branch = await runGit(root, ['branch', '--show-current']);

    return {
      path: root,
      name: path.basename(root),
      currentBranch: branch || null,
    };
  }
}

function runGit(cwd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile('git', args, { cwd, encoding: 'utf8' }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error((stderr || error.message).trim()));
        return;
      }

      resolve(stdout.trim());
    });
  });
}
