/**
 * useFeatureFlags hook
 * Fetches feature flags from the backend and caches them.
 * Falls back to showing all entry points if the endpoint is unavailable.
 * Validates: Requirements 29.4, 29.6
 */

import { useQuery } from '@tanstack/react-query';
import { authClient } from '@/lib/api/client';

type FeatureFlags = Record<string, boolean>;

async function fetchFeatureFlags(): Promise<FeatureFlags> {
    try {
        const response = await authClient.get<FeatureFlags | { data: FeatureFlags }>('/feature-flags');
        const data = response.data;
        // Handle both wrapped and unwrapped responses
        if (data && typeof data === 'object' && 'data' in data && typeof (data as any).data === 'object') {
            return (data as any).data as FeatureFlags;
        }
        return data as FeatureFlags;
    }
    catch {
        // Endpoint may not exist — return empty object (all flags default to enabled in UI)
        return {};
    }
}

/**
 * Returns feature flag states.
 * If the endpoint is unavailable, all flags default to true (show entry points).
 * The backend 403 with FEATURE_DISABLED is the authoritative gate.
 */
export function useFeatureFlags() {
    const { data = {} } = useQuery<FeatureFlags>({
        queryKey: ['feature-flags'],
        queryFn: fetchFeatureFlags,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: false,
    });

    return {
        isTeacherPerformanceEnabled: data['teacher.performance.enabled'] ?? true,
        isParentPerformanceEnabled: data['parent.performance.enabled'] ?? true,
        isLowScoreNotificationsEnabled: data['notifications.low_score.enabled'] ?? true,
    };
}
