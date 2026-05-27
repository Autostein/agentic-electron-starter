import { execFile } from 'node:child_process';
import type {
  AgentRunCommitDetail,
  AgentRunCommitFileDiff,
  AgentRunCommitSummary,
} from '@/core/agent-runs/application/read-models/commit-diff';
import type { GitCommitReadService } from '@/core/agent-runs/application/ports/git-commit-read-service';
import type {
  GetCommitDetailInput,
  GetCommitFileDiffInput,
  GetCommitSummaryInput,
} from '@/core/agent-runs/domain';
import {
  parseNumstat,
  parseUnifiedDiff,
  parseUnifiedFileDiff,
} from './git-commit-diff-parser';

export class LocalGitCommitInspector implements GitCommitReadService {
  async getCommitSummary(input: GetCommitSummaryInput): Promise<AgentRunCommitSummary> {
    const [metadata, numstat] = await Promise.all([
      getMetadata(input.repoPath, input.commit.sha),
      getNumstat(input.repoPath, input.commit.sha),
    ]);
    const stats = parseNumstat(numstat);

    return {
      ...input.commit,
      shortSha: metadata.shortSha,
      subject: metadata.subject,
      filesChanged: stats.filesChanged,
      additions: stats.additions,
      deletions: stats.deletions,
      unavailable: false,
    };
  }

  async getCommitDetail(input: GetCommitDetailInput): Promise<AgentRunCommitDetail> {
    const [metadata, numstat, patch] = await Promise.all([
      getFullMetadata(input.repoPath, input.sha),
      getNumstat(input.repoPath, input.sha),
      getPatch(input.repoPath, input.sha),
    ]);
    const stats = parseNumstat(numstat);

    return {
      runId: input.runId,
      sha: metadata.sha,
      shortSha: metadata.shortSha,
      subject: metadata.subject,
      authorName: metadata.authorName,
      authorEmail: metadata.authorEmail,
      committedAt: metadata.committedAt,
      filesChanged: stats.filesChanged,
      additions: stats.additions,
      deletions: stats.deletions,
      files: parseUnifiedDiff(patch, {
        largeFileLineThreshold: input.largeFileLineThreshold,
      }),
    };
  }

  async getCommitFileDiff(input: GetCommitFileDiffInput): Promise<AgentRunCommitFileDiff> {
    const patch = await getPatch(input.repoPath, input.sha, input.path);
    return parseUnifiedFileDiff(patch);
  }
}

type CommitMetadata = {
  sha: string;
  shortSha: string;
  subject: string;
};

type FullCommitMetadata = CommitMetadata & {
  authorName: string;
  authorEmail: string;
  committedAt: number;
};

async function getMetadata(repoPath: string, sha: string): Promise<CommitMetadata> {
  const output = await runGit(repoPath, ['show', '-s', '--format=%H%x00%h%x00%s', sha]);
  const [fullSha, shortSha, subject] = output.split('\0');

  return {
    sha: fullSha ?? sha,
    shortSha: shortSha ?? sha.slice(0, 7),
    subject: subject ?? '',
  };
}

async function getFullMetadata(repoPath: string, sha: string): Promise<FullCommitMetadata> {
  const output = await runGit(
    repoPath,
    ['show', '-s', '--format=%H%x00%h%x00%s%x00%an%x00%ae%x00%ct', sha],
  );
  const [fullSha, shortSha, subject, authorName, authorEmail, committedAt] = output.split('\0');

  return {
    sha: fullSha ?? sha,
    shortSha: shortSha ?? sha.slice(0, 7),
    subject: subject ?? '',
    authorName: authorName ?? '',
    authorEmail: authorEmail ?? '',
    committedAt: Number(committedAt ?? 0) * 1000,
  };
}

function getNumstat(repoPath: string, sha: string): Promise<string> {
  return runGit(repoPath, ['show', '--numstat', '--format=', '--find-renames', '--find-copies', sha]);
}

function getPatch(repoPath: string, sha: string, filePath?: string): Promise<string> {
  const args = [
    'show',
    '--patch',
    '--format=',
    '--no-color',
    '--find-renames',
    '--find-copies',
    '--unified=3',
    sha,
  ];

  if (filePath) {
    args.push('--', filePath);
  }

  return runGit(repoPath, args);
}

function runGit(cwd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile('git', args, { cwd, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error((stderr || error.message).trim()));
        return;
      }

      resolve(stdout.trimEnd());
    });
  });
}
