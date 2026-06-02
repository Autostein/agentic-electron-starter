import type {
  AgentRun,
  AgentRunCommit,
  AgentRunEvent,
  AgentRunRepository,
} from '../../domain';
import type { AgentRunCommitSummary } from '../read-models/commit-diff';
import type { GitCommitReadService } from '../ports/git-commit-read-service';

export type AgentRunDetail = {
  run: AgentRun;
  events: AgentRunEvent[];
  commits: AgentRunCommitSummary[];
};

export type GetAgentRunDeps = {
  agentRunRepository: AgentRunRepository;
  gitCommitReadService: GitCommitReadService;
};

export async function getAgentRun(
  id: string,
  deps: GetAgentRunDeps,
): Promise<AgentRunDetail | null> {
  const run = await deps.agentRunRepository.getRun(id);

  if (!run) {
    return null;
  }

  const [events, commits] = await Promise.all([
    deps.agentRunRepository.listEvents(id),
    deps.agentRunRepository.listCommits(id),
  ]);

  const summaries = await Promise.all(
    commits.map((commit) => getCommitSummary(
      run.targetFolderPath,
      commit,
      deps.gitCommitReadService,
    )),
  );

  return { run, events, commits: summaries };
}

async function getCommitSummary(
  repoPath: string,
  commit: AgentRunCommit,
  gitCommitReadService: GitCommitReadService,
): Promise<AgentRunCommitSummary> {
  try {
    return await gitCommitReadService.getCommitSummary({ repoPath, commit });
  } catch {
    return {
      ...commit,
      shortSha: commit.sha.slice(0, 7),
      subject: null,
      filesChanged: null,
      additions: null,
      deletions: null,
      unavailable: true,
    };
  }
}
