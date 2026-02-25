/**
 * useSessionRankings hook
 * Validates: Requirements 19.10, 20.3
 */

import type { RankingsResponse, WindowFilter } from '../types';
import { useQuery } from '@tanstack/react-query';
import { getSessionRankings } from '../services';

export function useSessionRankings(templateId: string, window: WindowFilter = 'all') {
    return useQuery<RankingsResponse, Error>({
        queryKey: ['teacher', 'session-rankings', templateId, window],
        queryFn: () => getSessionRankings(templateId, window),
        enabled: !!templateId,
    });
}
