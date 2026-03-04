/**
 * useFeatureFlags hook
 * Fetches feature flags from the backend and caches them.
 * Falls back to showing all entry points if the endpoint is unavailable.
 * Validates: Requirements 29.4, 29.6
 */

import { useQuery } from '@tanstack/react-query';
import { authClient } from '@/lib/api/client';

type FeatureFlags = Record<string, boolean>;

export type FeatureFlagState = {
  isTeacherPerformanceEnabled: boolean;
  isParentPerformanceEnabled: boolean;
  isLowScoreNotificationsEnabled: boolean;
  isGoogleSigninMobileEnabled: boolean;
  isGoogleSigninWebEnabled: boolean;
  isForgotPasswordEnabled: boolean;
};

async function fetchFeatureFlags(): Promise<FeatureFlags> {
  try {
    const response = await authClient.get<FeatureFlags | { data: FeatureFlags }>('/feature-flags');
    const data = response.data;

    // Handle both wrapped and unwrapped responses
    if (
      data
      && typeof data === 'object'
      && 'data' in data
      && typeof (data as { data?: unknown }).data === 'object'
      && (data as { data?: unknown }).data !== null
    ) {
      return (data as { data: FeatureFlags }).data;
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
 * If the endpoint is unavailable, Google auth defaults to false (hidden).
 * Backend remains the source of truth for enabled features.
 * The backend 403 with FEATURE_DISABLED is the authoritative gate.
 */
export function useFeatureFlags(): FeatureFlagState {
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
    isGoogleSigninMobileEnabled: data.google_signin_mobile ?? false,
    isGoogleSigninWebEnabled: data.google_signin_web ?? false,
    isForgotPasswordEnabled: data.forgot_password_enabled ?? true,
  } satisfies FeatureFlagState;
}
