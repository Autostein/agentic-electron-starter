import { useQuery } from '@tanstack/react-query';
import { getAppInfo } from '../client/app-info-client';

export function useAppInfo() {
  return useQuery({
    queryKey: ['app-info'],
    queryFn: getAppInfo,
  });
}
