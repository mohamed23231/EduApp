import { useQuery } from '@tanstack/react-query';
import { QueryKey } from '@/shared/constants/query-keys';
import { fetchAttendanceStats } from '../services/attendance.service';

/**
 * Hook to fetch attendance statistics for a selected student.
 * Disabled when no student is selected.
 * Validates: Requirements 10.1, 10.4, 10.5
 */
export function useAttendanceStats(studentId: string) {
  return useQuery({
    queryKey: QueryKey.parent.attendanceStats(studentId),
    queryFn: () => fetchAttendanceStats(studentId),
    enabled: Boolean(studentId),
  });
}
