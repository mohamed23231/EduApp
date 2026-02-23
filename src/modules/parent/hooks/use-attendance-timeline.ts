import { useQuery } from '@tanstack/react-query';
import { QueryKey } from '@/shared/constants/query-keys';
import { fetchAttendanceTimeline } from '../services/attendance.service';

/**
 * Hook to fetch attendance timeline for a selected student.
 * Disabled when no student is selected.
 * Defaults to page=1, limit=5 for dashboard usage.
 * Validates: Requirements 10.2, 10.4, 10.5
 */
export function useAttendanceTimeline(studentId: string, page: number = 1, limit: number = 5) {
  return useQuery({
    queryKey: QueryKey.parent.attendanceTimeline(studentId, page),
    queryFn: () => fetchAttendanceTimeline(studentId, page, limit),
    enabled: Boolean(studentId),
  });
}
