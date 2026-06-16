/**
 * useStudents hook
 * Fetches all students linked to the authenticated parent, including unlinked
 * (revoked) children so they can render read-only. The query key carries an
 * `includeUnlinked` segment so the broader (unlinked-inclusive) response never
 * shares a cache slot with a legacy active-only fetch.
 * Validates: Requirements 8.1, 8.2, 8.3, 10.1
 */

import { useQuery } from '@tanstack/react-query';
import { QueryKey } from '@/shared/constants/query-keys';
import { fetchStudents } from '../services/students.service';

export function useStudents() {
  return useQuery({
    queryKey: [...QueryKey.parent.students, { includeUnlinked: true }] as const,
    queryFn: fetchStudents,
  });
}
