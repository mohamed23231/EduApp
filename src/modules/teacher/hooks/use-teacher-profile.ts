/**
 * useTeacherProfile hook
 * Calls GET /api/v1/teachers/me and returns the enriched profile response.
 * Typed against ProfileResponseDto shape:
 *   { teacherStatus, trial: TrialData | null, subscription: SubscriptionData | null, entitlements: EntitlementsData }
 *
 * Validates: Requirements 7.1, 7.2
 */

import type { ProfileResponseDto } from '../types';
import type { ApiSuccess } from '@/shared/types/api';
import { useCallback, useEffect, useState } from 'react';
import { client } from '@/lib/api/client';
import { unwrapData } from '@/shared/services/api-utils';

type UseTeacherProfileResult = {
  profile: ProfileResponseDto | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

async function fetchTeacherProfile(): Promise<ProfileResponseDto> {
  const response = await client.get<ApiSuccess<ProfileResponseDto> | ProfileResponseDto>(
    '/teachers/me',
  );
  return unwrapData<ProfileResponseDto>(response.data);
}

export function useTeacherProfile(): UseTeacherProfileResult {
  const [profile, setProfile] = useState<ProfileResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchTeacherProfile();
      setProfile(data);
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    }
    finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { profile, isLoading, error, refetch: load };
}
