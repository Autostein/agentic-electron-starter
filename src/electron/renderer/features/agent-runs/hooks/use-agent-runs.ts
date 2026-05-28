import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { StartAgentRunInput } from '@/contracts/ipc/agent-runs.contract';
import {
  cancelAgentRun,
  getAgentRunCommitDetails,
  getAgentRunCommitFileDiff,
  getAgentRun,
  listAgentRuns,
  onAgentRunEvent,
  startAgentRun,
} from '../client/agent-runs-client';

export const agentRunsQueryKey = ['agent-runs'] as const;

export function useAgentRuns(workspaceId?: string) {
  return useQuery({
    queryKey: [...agentRunsQueryKey, workspaceId ?? 'all'],
    queryFn: () => listAgentRuns(workspaceId ? { workspaceId } : undefined),
  });
}

export function useAgentRun(runId: string | undefined) {
  return useQuery({
    queryKey: [...agentRunsQueryKey, 'detail', runId],
    queryFn: () => getAgentRun({ id: runId ?? '' }),
    enabled: Boolean(runId),
  });
}

export function useAgentRunCommitDetails(runId: string | undefined, sha: string | undefined) {
  return useQuery({
    queryKey: [...agentRunsQueryKey, 'commit', runId, sha],
    queryFn: () => getAgentRunCommitDetails({ runId: runId ?? '', sha: sha ?? '' }),
    enabled: Boolean(runId && sha),
  });
}

export function useAgentRunCommitFileDiff(
  input: { runId: string; sha: string; path: string } | undefined,
) {
  return useQuery({
    queryKey: [...agentRunsQueryKey, 'commit-file', input?.runId, input?.sha, input?.path],
    queryFn: () => getAgentRunCommitFileDiff(input ?? { runId: '', sha: '', path: '' }),
    enabled: Boolean(input),
  });
}

export function useStartAgentRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: StartAgentRunInput) => startAgentRun(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: agentRunsQueryKey });
    },
  });
}

export function useCancelAgentRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelAgentRun,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: agentRunsQueryKey });
    },
  });
}

export function useAgentRunEventSubscription(runId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!runId) {
      return undefined;
    }

    return onAgentRunEvent({ runId }, () => {
      void queryClient.invalidateQueries({
        queryKey: [...agentRunsQueryKey, 'detail', runId],
      });
      void queryClient.invalidateQueries({ queryKey: agentRunsQueryKey });
    });
  }, [queryClient, runId]);
}
