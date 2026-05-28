import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listWorkspaces, pickWorkspace } from '../client/workspaces-client';

export const workspacesQueryKey = ['workspaces'] as const;

export function useWorkspaces() {
  return useQuery({
    queryKey: workspacesQueryKey,
    queryFn: listWorkspaces,
  });
}

export function usePickWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pickWorkspace,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspacesQueryKey });
    },
  });
}
