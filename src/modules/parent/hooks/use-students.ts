/**
 * useStudents hook
 * Fetches all students linked to the authenticated parent
 * Validates: Requirements 8.1, 8.2, 8.3, 10.1
 */

import { useQuery } from '@tanstack/react-query';
import { QueryKey } from '@/shared/constants/query-keys';
import { fetchStudents } from '../services/students.service';

export function useStudents() {
  return useQuery({
    queryKey: QueryKey.parent.students,
    queryFn: fetchStudents,
  });
}
