import type {
  AgentRunRepository,
} from '../../../domain/agent-runs';
import type { AgentRunCommitFileDiff } from './commit-read-models';
import type { GitCommitReadService } from './ports/git-commit-read-service';

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
    throw new Error('Agent run not found.');
  }

  const commits = await deps.agentRunRepository.listCommits(input.runId);

  if (!commits.some((commit) => commit.sha === input.sha)) {
    throw new Error('Commit is not recorded on this run.');
  }

  return deps.gitCommitReadService.getCommitFileDiff({
    repoPath: run.projectPath,
    sha: input.sha,
    path: input.path,
  });
}
