/**
 * useConnectionCode hook
 * Manage student access codes
 * Validates: Requirements 11.1, 11.3, 11.4, 11.5, 11.6, 11.8, 11.9, 12.1, 12.2, 12.3, 12.4, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.9
 */

import type { AccessCode } from '../types';
import { useCallback, useEffect, useState } from 'react';
import { Clipboard, Share } from 'react-native';
import { getAccessCode, regenerateAccessCode } from '../services';

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
  const [code, setCode] = useState<AccessCode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCode = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const accessCode = await getAccessCode(studentId);
      setCode(accessCode);
    }
    catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch access code';
      setError(errorMessage);
    }
    finally {
      setIsLoading(false);
    }
  }, [studentId]);

  const regenerate = useCallback(async () => {
    try {
      setIsRegenerating(true);
      setError(null);
      const accessCode = await regenerateAccessCode(studentId);
      setCode(accessCode);
    }
    catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to regenerate access code';
      setError(errorMessage);
    }
    finally {
      setIsRegenerating(false);
    }
  }, [studentId]);

  const copyToClipboard = useCallback(async () => {
    if (!code) {
      return;
    }

    try {
      await Clipboard.setString(code.code);
    }
    catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to copy to clipboard';
      setError(errorMessage);
    }
  }, [code]);

  const share = useCallback(async () => {
    if (!code) {
      return;
    }

    try {
      await Share.share({
        message: code.code,
      });
    }
    catch (err) {
      // User cancelled sharing - not an error
      if (err && typeof err === 'object' && 'message' in err && err.message === 'User did not share') {
        return;
      }
      const errorMessage = err instanceof Error ? err.message : 'Failed to share access code';
      setError(errorMessage);
    }
  }, [code]);

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
