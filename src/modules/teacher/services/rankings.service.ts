/**
 * Session rankings API service (teacher-only).
 * Validates: Requirements 19.10
 */

import type { RankingsResponse } from '../types';
import type { WindowFilter } from '@/shared/performance';
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
