import type {
  GetCommitDetailInput,
  GetCommitFileDiffInput,
  GetCommitSummaryInput,
} from '../../../../domain/agent-runs';
import type {
  AgentRunCommitDetail,
  AgentRunCommitFileDiff,
  AgentRunCommitSummary,
} from '../commit-read-models';

export interface GitCommitReadService {
  getCommitSummary(input: GetCommitSummaryInput): Promise<AgentRunCommitSummary>;
  getCommitDetail(input: GetCommitDetailInput): Promise<AgentRunCommitDetail>;
  getCommitFileDiff(input: GetCommitFileDiffInput): Promise<AgentRunCommitFileDiff>;
}
