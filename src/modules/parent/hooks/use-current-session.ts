import { useQuery } from '@tanstack/react-query';
import { QueryKey } from '@/shared/constants/query-keys';
import { fetchCurrentSession } from '../services/sessions.service';

/**
 * Polls the live "is my child in class right now?" state for the dashboard hero.
 *
 * 60s refetch interval gives a near-realtime feel without burning radio.
 * Matching staleTime avoids a redundant refetch on every remount; React
 * Query's default refetchOnWindowFocus still refreshes data when the parent
 * reopens the app from background.
 */
export function useCurrentSession(studentId: string) {
  return useQuery({
    queryKey: QueryKey.parent.currentSession(studentId),
    queryFn: () => fetchCurrentSession(studentId),
    enabled: Boolean(studentId),
    refetchInterval: 60_000,
    staleTime: 60_000,
  });
}
