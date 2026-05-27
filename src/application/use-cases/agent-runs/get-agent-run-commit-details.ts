import type {
  AgentRunRepository,
} from '../../../domain/agent-runs';
import type { AgentRunCommitDetail } from './commit-read-models';
import type { GitCommitReadService } from './ports/git-commit-read-service';

export type GetAgentRunCommitDetailsInput = {
  runId: string;
  sha: string;
};

export type GetAgentRunCommitDetailsDeps = {
  agentRunRepository: AgentRunRepository;
  gitCommitReadService: GitCommitReadService;
};

const LARGE_FILE_LINE_THRESHOLD = 400;

export async function getAgentRunCommitDetails(
  input: GetAgentRunCommitDetailsInput,
  deps: GetAgentRunCommitDetailsDeps,
): Promise<AgentRunCommitDetail> {
  const run = await deps.agentRunRepository.getRun(input.runId);

  if (!run) {
    throw new Error('Agent run not found.');
  }

  const commits = await deps.agentRunRepository.listCommits(input.runId);

  if (!commits.some((commit) => commit.sha === input.sha)) {
    throw new Error('Commit is not recorded on this run.');
  }

  return deps.gitCommitReadService.getCommitDetail({
    repoPath: run.projectPath,
    runId: run.id,
    sha: input.sha,
    largeFileLineThreshold: LARGE_FILE_LINE_THRESHOLD,
  });
}
