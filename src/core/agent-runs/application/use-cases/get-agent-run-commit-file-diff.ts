import type {
  AgentRunRepository,
} from '../../domain';
import type { AgentRunCommitFileDiff } from '../read-models/commit-diff';
import type { GitCommitReadService } from '../ports/git-commit-read-service';
import { AppError } from '@/shared/app-errors';

export type GetAgentRunCommitFileDiffInput = {
  runId: string;
  sha: string;
  path: string;
};

export type GetAgentRunCommitFileDiffDeps = {
  agentRunRepository: AgentRunRepository;
  gitCommitReadService: GitCommitReadService;
};

export async function getAgentRunCommitFileDiff(
  input: GetAgentRunCommitFileDiffInput,
  deps: GetAgentRunCommitFileDiffDeps,
): Promise<AgentRunCommitFileDiff> {
  const run = await deps.agentRunRepository.getRun(input.runId);

  if (!run) {
    throw new AppError('NOT_FOUND', 'Agent run not found.');
  }

  const commits = await deps.agentRunRepository.listCommits(input.runId);

  if (!commits.some((commit) => commit.sha === input.sha)) {
    throw new AppError('NOT_FOUND', 'Commit is not recorded on this run.');
  }

  return deps.gitCommitReadService.getCommitFileDiff({
    repoPath: run.targetFolderPath,
    sha: input.sha,
    path: input.path,
  });
}
