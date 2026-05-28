import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  DockerImageBuildEventResult,
  UpdateAgentRuntimeProfileInput,
} from '@/contracts/ipc/agent-runtime.contract';
import {
  buildAgentRuntimeImage,
  duplicateStarterRuntimeProfile,
  getAgentRuntimeImageStatus,
  getAgentRuntimeProfile,
  getAgentRuntimeProfileDockerfile,
  listAgentProviderAuthStatuses,
  listAgentRuntimeProfiles,
  onAgentRuntimeBuildEvent,
  openAgentRuntimeProfileFolder,
  resetAgentRuntimeProfileDockerfile,
  updateAgentRuntimeProfile,
  updateAgentRuntimeProfileDockerfile,
} from '../client/agent-runtime-client';

export const agentRuntimeProfilesQueryKey = ['agent-runtime-profiles'] as const;
export const agentProviderAuthStatusesQueryKey = ['agent-provider-auth-statuses'] as const;
export const agentRuntimeImageStatusQueryKey = ['agent-runtime-image-status'] as const;
export const agentRuntimeDockerfileQueryKey = ['agent-runtime-dockerfile'] as const;

export function useAgentProviderAuthStatuses() {
  return useQuery({
    queryKey: agentProviderAuthStatusesQueryKey,
    queryFn: listAgentProviderAuthStatuses,
  });
}

export function useAgentRuntimeProfiles() {
  return useQuery({
    queryKey: agentRuntimeProfilesQueryKey,
    queryFn: listAgentRuntimeProfiles,
  });
}

export function useAgentRuntimeProfile(profileId: string | undefined) {
  return useQuery({
    queryKey: [...agentRuntimeProfilesQueryKey, 'detail', profileId],
    queryFn: () => getAgentRuntimeProfile({ id: profileId ?? '' }),
    enabled: Boolean(profileId),
  });
}

export function useUpdateAgentRuntimeProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAgentRuntimeProfile,
    onSuccess: (profile) => {
      void queryClient.invalidateQueries({ queryKey: agentRuntimeProfilesQueryKey });
      void queryClient.invalidateQueries({
        queryKey: [...agentRuntimeProfilesQueryKey, 'detail', profile.id],
      });
      void queryClient.invalidateQueries({
        queryKey: [...agentRuntimeImageStatusQueryKey, profile.id],
      });
    },
  });
}

export function useDuplicateStarterRuntimeProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: duplicateStarterRuntimeProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: agentRuntimeProfilesQueryKey });
    },
  });
}

export function useAgentRuntimeProfileDockerfile(profileId: string | undefined) {
  return useQuery({
    queryKey: [...agentRuntimeDockerfileQueryKey, profileId],
    queryFn: () => getAgentRuntimeProfileDockerfile({ profileId: profileId ?? '' }),
    enabled: Boolean(profileId),
  });
}

export function useUpdateAgentRuntimeProfileDockerfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAgentRuntimeProfileDockerfile,
    onSuccess: (result) => {
      void queryClient.invalidateQueries({
        queryKey: [...agentRuntimeDockerfileQueryKey, result.profileId],
      });
      void queryClient.invalidateQueries({
        queryKey: [...agentRuntimeImageStatusQueryKey, result.profileId],
      });
    },
  });
}

export function useResetAgentRuntimeProfileDockerfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resetAgentRuntimeProfileDockerfile,
    onSuccess: (result) => {
      void queryClient.invalidateQueries({
        queryKey: [...agentRuntimeDockerfileQueryKey, result.profileId],
      });
      void queryClient.invalidateQueries({
        queryKey: [...agentRuntimeImageStatusQueryKey, result.profileId],
      });
    },
  });
}

export function useOpenAgentRuntimeProfileFolder() {
  return useMutation({
    mutationFn: openAgentRuntimeProfileFolder,
  });
}

export function useAgentRuntimeImageStatus(profileId: string | undefined) {
  return useQuery({
    queryKey: [...agentRuntimeImageStatusQueryKey, profileId],
    queryFn: () => getAgentRuntimeImageStatus({ profileId: profileId ?? '' }),
    enabled: Boolean(profileId),
  });
}

export function useBuildAgentRuntimeImage(profileId: string | undefined) {
  const [events, setEvents] = useState<DockerImageBuildEventResult[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => onAgentRuntimeBuildEvent((event) => {
    if (event.profileId === profileId) {
      setEvents((current) => [...current.slice(-199), event]);
    }
  }), [profileId]);

  return {
    events,
    mutation: useMutation({
      mutationFn: () => buildAgentRuntimeImage({ profileId: profileId ?? '' }),
      onMutate: () => {
        setEvents([]);
      },
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: [...agentRuntimeImageStatusQueryKey, profileId],
        });
      },
    }),
  };
}

export type RuntimeProfileFormInput = UpdateAgentRuntimeProfileInput;
