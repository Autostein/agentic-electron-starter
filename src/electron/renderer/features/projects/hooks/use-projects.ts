import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listProjects, pickProject } from '../client/projects-client';

export const projectsQueryKey = ['projects'] as const;

export function useProjects() {
  return useQuery({
    queryKey: projectsQueryKey,
    queryFn: listProjects,
  });
}

export function usePickProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pickProject,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectsQueryKey });
    },
  });
}
