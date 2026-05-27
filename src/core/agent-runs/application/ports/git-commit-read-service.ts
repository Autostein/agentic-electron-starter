import type {
  GetCommitDetailInput,
  GetCommitFileDiffInput,
  GetCommitSummaryInput,
} from '../../domain';
import type {
  AgentRunCommitDetail,
  AgentRunCommitFileDiff,
  AgentRunCommitSummary,
} from '../read-models/commit-diff';

export interface GitCommitReadService {
  getCommitSummary(input: GetCommitSummaryInput): Promise<AgentRunCommitSummary>;
  getCommitDetail(input: GetCommitDetailInput): Promise<AgentRunCommitDetail>;
  getCommitFileDiff(input: GetCommitFileDiffInput): Promise<AgentRunCommitFileDiff>;
}
