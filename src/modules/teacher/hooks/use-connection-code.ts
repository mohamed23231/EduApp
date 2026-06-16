/**
 * useConnectionCode hook
 * Manage student access codes
 * Validates: Requirements 11.1, 11.3, 11.4, 11.5, 11.6, 11.8, 11.9, 12.1, 12.2, 12.3, 12.4, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.9
 */

import type { AccessCode } from '../types';
import * as ExpoClipboard from 'expo-clipboard';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Share } from 'react-native';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { getAccessCode, regenerateAccessCode } from '../services';
import { getTeacherIdHash, trackConnectionCodeShared } from '../services/analytics.service';

type UseConnectionCodeResult = {
  code: AccessCode | null;
  isLoading: boolean;
  isRegenerating: boolean;
  error: string | null;
  regenerate: () => Promise<void>;
  copyToClipboard: () => Promise<void>;
  share: () => Promise<void>;
};

/**
 * Hook to manage student connection code
 */
export function useConnectionCode(studentId: string): UseConnectionCodeResult {
  const { t } = useTranslation();
  const [code, setCode] = useState<AccessCode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore.use.user();

  const fetchCode = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const accessCode = await getAccessCode(studentId);
      setCode(accessCode);
    }
    catch (err) {
      console.error('[useConnectionCode] fetch failed', err);
      setError(t('teacher.connectionCode.fetchError', 'Failed to fetch access code'));
    }
    finally {
      setIsLoading(false);
    }
  }, [studentId, t]);

  const regenerate = useCallback(async () => {
    try {
      setIsRegenerating(true);
      setError(null);
      const accessCode = await regenerateAccessCode(studentId);
      setCode(accessCode);
    }
    catch (err) {
      console.error('[useConnectionCode] regenerate failed', err);
      setError(t('teacher.connectionCode.regenerateError', 'Failed to regenerate access code'));
    }
    finally {
      setIsRegenerating(false);
    }
  }, [studentId, t]);

  const copyToClipboard = useCallback(async () => {
    if (!code) {
      return;
    }

    try {
      await ExpoClipboard.setStringAsync(code.code);
    }
    catch (err) {
      console.error('[useConnectionCode] copy failed', err);
      setError(t('teacher.connectionCode.copyError', 'Failed to copy to clipboard'));
    }
  }, [code, t]);

  const share = useCallback(async () => {
    if (!code) {
      return;
    }

    try {
      const result = await Share.share({
        message: code.code,
      });
      // User dismissed the share sheet — not an error, skip analytics
      if (result.action === Share.dismissedAction) {
        return;
      }
      // Track analytics only on a confirmed share
      if (result.action === Share.sharedAction && user?.id) {
        trackConnectionCodeShared(getTeacherIdHash(user.id), studentId);
      }
    }
    catch (err) {
      console.error('[useConnectionCode] share failed', err);
      setError(t('teacher.connectionCode.shareError', 'Failed to share access code'));
    }
  }, [code, user, studentId, t]);

  // Fetch code on mount
  useEffect(() => {
    fetchCode();
  }, [fetchCode]);

  return {
    code,
    isLoading,
    isRegenerating,
    error,
    regenerate,
    copyToClipboard,
    share,
  };
}
