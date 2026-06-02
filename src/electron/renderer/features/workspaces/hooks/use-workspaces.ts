import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createWorkspace,
  getWorkspace,
  listWorkspaces,
  pickWorkspaceFolder,
  removeWorkspaceFolder,
  updateWorkspace,
  updateWorkspaceFolder,
} from '../client/workspaces-client';

export const workspacesQueryKey = ['workspaces'] as const;

export function useWorkspaces() {
  return useQuery({
    queryKey: workspacesQueryKey,
    queryFn: listWorkspaces,
  });
}

export function useWorkspace(workspaceId: string | undefined) {
  return useQuery({
    queryKey: [...workspacesQueryKey, 'detail', workspaceId],
    queryFn: () => getWorkspace({ id: workspaceId ?? '' }),
    enabled: Boolean(workspaceId),
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWorkspace,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspacesQueryKey });
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateWorkspace,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspacesQueryKey });
    },
  });
}

export function usePickWorkspaceFolder(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => pickWorkspaceFolder({ workspaceId: workspaceId ?? '' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspacesQueryKey });
    },
  });
}

export function useUpdateWorkspaceFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateWorkspaceFolder,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspacesQueryKey });
    },
  });
}

export function useRemoveWorkspaceFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeWorkspaceFolder,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspacesQueryKey });
    },
  });
}
