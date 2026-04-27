/**
 * Shared performance API service — fetch functions for both parent and teacher.
 * Validates: Requirements 19.10, 22.9, 25.7
 */

import type { ParentPerformanceResponse, PerformanceResponse, WindowFilter } from './types';
import type { ApiSuccess } from '@/shared/types/api';
import { authClient } from '@/lib/api/client';
import { unwrapData } from '@/shared/services/api-utils';

const PAGE_SIZE = 20;

export async function getTeacherStudentPerformance(
  studentId: string,
  window: WindowFilter = 'all',
  cursor?: string,
): Promise<PerformanceResponse> {
  const response = await authClient.get<ApiSuccess<PerformanceResponse> | PerformanceResponse>(
    `/students/${studentId}/performance`,
    { params: { window, cursor, pageSize: PAGE_SIZE } },
  );
  return unwrapData<PerformanceResponse>(response.data);
}

export async function getParentStudentPerformance(
  studentId: string,
  window: WindowFilter = 'all',
  cursor?: string,
): Promise<ParentPerformanceResponse> {
  const response = await authClient.get<ApiSuccess<ParentPerformanceResponse> | ParentPerformanceResponse>(
    `/v1/parents/students/${studentId}/performance`,
    { params: { window, cursor, pageSize: PAGE_SIZE } },
  );
  return unwrapData<ParentPerformanceResponse>(response.data);
}
