/**
 * Performance analytics API service
 * Validates: Requirements 19.10, 22.9, 25.7
 */

import type {
  ParentPerformanceResponse,
  PerformanceResponse,
  RankingsResponse,
  WindowFilter,
} from '../types';
import type { ApiSuccess } from '@/shared/types/api';
import { authClient } from '@/lib/api/client';
import { unwrapData } from '@/shared/services/api-utils';

export async function getSessionRankings(
  templateId: string,
  window: WindowFilter = 'all',
): Promise<RankingsResponse> {
  const response = await authClient.get<ApiSuccess<RankingsResponse> | RankingsResponse>(
    `/session-templates/${templateId}/rankings`,
    { params: { window } },
  );
  return unwrapData<RankingsResponse>(response.data);
}

export async function getTeacherStudentPerformance(
  studentId: string,
  window: WindowFilter = 'all',
  cursor?: string,
  pageSize = 20,
): Promise<PerformanceResponse> {
  const response = await authClient.get<ApiSuccess<PerformanceResponse> | PerformanceResponse>(
    `/students/${studentId}/performance`,
    { params: { window, cursor, pageSize } },
  );
  return unwrapData<PerformanceResponse>(response.data);
}

export async function getParentStudentPerformance(
  studentId: string,
  window: WindowFilter = 'all',
  cursor?: string,
  pageSize = 20,
): Promise<ParentPerformanceResponse> {
  const response = await authClient.get<ApiSuccess<ParentPerformanceResponse> | ParentPerformanceResponse>(
    `/v1/parents/students/${studentId}/performance`,
    { params: { window, cursor, pageSize } },
  );
  return unwrapData<ParentPerformanceResponse>(response.data);
}
