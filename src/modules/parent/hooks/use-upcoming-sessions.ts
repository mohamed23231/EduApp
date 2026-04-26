import { useQuery } from '@tanstack/react-query';
import { QueryKey } from '@/shared/constants/query-keys';
import { fetchUpcomingSessions } from '../services/sessions.service';

/**
 * Returns the next N sessions the student is enrolled in (default 1).
 * Used to populate the "next class" hero state when no live session matches.
 */
export function useUpcomingSessions(studentId: string, limit: number = 1) {
  return useQuery({
    queryKey: QueryKey.parent.upcomingSessions(studentId, limit),
    queryFn: () => fetchUpcomingSessions(studentId, limit),
    enabled: Boolean(studentId),
    refetchOnWindowFocus: true,
  });
}
