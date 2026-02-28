/**
 * useStudentPerformance hook
 * Supports both teacher and parent roles via cursor-based infinite pagination.
 * Validates: Requirements 22.9, 25.7
 */

import type { ParentPerformanceResponse, PerformanceResponse, WindowFilter } from '../types';
import { useInfiniteQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { getParentStudentPerformance, getTeacherStudentPerformance } from '../services';

type Role = 'teacher' | 'parent';

export function useStudentPerformance(
  studentId: string,
  window: WindowFilter = 'all',
  role: Role = 'teacher',
  pageSize = 20,
) {
  return useInfiniteQuery<PerformanceResponse | ParentPerformanceResponse, Error>({
    queryKey: [role, 'student-performance', studentId, window],
    queryFn: ({ pageParam }) => {
      const cursor = pageParam as string | undefined;
      if (role === 'parent') {
        return getParentStudentPerformance(studentId, window, cursor, pageSize);
      }
      return getTeacherStudentPerformance(studentId, window, cursor, pageSize);
    },
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage.nextCursor ?? undefined,
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on 403 (feature disabled) or 404 (not found)
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        if (status === 403 || status === 404)
          return false;
      }
      return failureCount < 2;
    },
  });
}
