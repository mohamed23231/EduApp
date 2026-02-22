/**
 * useStudentDetails hook
 * Fetches detailed information for a specific student
 * Validates: Requirements 11.1, 11.3
 */

import { useQuery } from '@tanstack/react-query';
import { QueryKey } from '@/shared/constants/query-keys';
import { fetchStudentDetails } from '../services/students.service';

export function useStudentDetails(studentId: string) {
  return useQuery({
    queryKey: QueryKey.parent.studentDetails(studentId),
    queryFn: () => fetchStudentDetails(studentId),
    enabled: Boolean(studentId),
  });
}
