import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DockerImageBuildEventResult } from '@/contracts/ipc/agent-runtime.contract';
import {
  buildAgentRuntimeImage,
  getAgentRuntimeImageStatus,
  getAgentRuntimeSettings,
  onAgentRuntimeBuildEvent,
  updateAgentRuntimeSettings,
} from '../client/agent-runtime-client';

export const agentRuntimeSettingsQueryKey = ['agent-runtime-settings'] as const;
export const agentRuntimeImageStatusQueryKey = ['agent-runtime-image-status'] as const;

export function useAgentRuntimeSettings() {
  return useQuery({
    queryKey: agentRuntimeSettingsQueryKey,
    queryFn: getAgentRuntimeSettings,
  });
}

export function useUpdateAgentRuntimeSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAgentRuntimeSettings,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: agentRuntimeSettingsQueryKey });
      void queryClient.invalidateQueries({ queryKey: agentRuntimeImageStatusQueryKey });
    },
  });
}

export function useAgentRuntimeImageStatus() {
  return useQuery({
    queryKey: agentRuntimeImageStatusQueryKey,
    queryFn: getAgentRuntimeImageStatus,
  });
}

export function useBuildAgentRuntimeImage() {
  const [events, setEvents] = useState<DockerImageBuildEventResult[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => onAgentRuntimeBuildEvent((event) => {
    setEvents((current) => [...current.slice(-199), event]);
  }), []);

  return {
    events,
    mutation: useMutation({
      mutationFn: buildAgentRuntimeImage,
      onMutate: () => {
        setEvents([]);
      },
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: agentRuntimeImageStatusQueryKey });
      },
    }),
  };
}
