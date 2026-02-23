/**
 * useTodaySessions hook
 * Fetches today's sessions on mount and screen focus
 * Recalculates date on timezone change
 */

import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { getTodayInstances } from '../services';
import { setLoadingSessions, setSessionsError, setTodaySessions } from '../store/use-teacher-store';

/**
 * Format current date as YYYY-MM-DD in device local timezone
 */
function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

type UseTodaySessionsResult = {
  refetch: () => Promise<void>;
};

/**
 * Hook to fetch and manage today's sessions
 */
export function useTodaySessions(): UseTodaySessionsResult {
  const fetchSessions = useCallback(async () => {
    try {
      setLoadingSessions(true);
      setSessionsError(null);
      const date = getTodayDate();
      const sessions = await getTodayInstances(date);
      setTodaySessions(sessions);
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch sessions';
      setSessionsError(errorMessage);
    }
    finally {
      setLoadingSessions(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Refetch on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchSessions();
    }, [fetchSessions]),
  );

  return {
    refetch: fetchSessions,
  };
}
