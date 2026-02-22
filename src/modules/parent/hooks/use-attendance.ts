import { useQuery } from '@tanstack/react-query';
import { QueryKey } from '@/shared/constants/query-keys';
import { fetchAttendance } from '../services/attendance.service';

/**
 * Hook to fetch attendance records for a student
 * Validates: Requirements 12.2, 12.3
 */
export function useAttendance(studentId: string) {
  return useQuery({
    queryKey: QueryKey.parent.attendance(studentId),
    queryFn: () => fetchAttendance(studentId),
    enabled: Boolean(studentId),
  });
}
