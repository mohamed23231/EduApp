/**
 * useTodaySessions hook
 * Fetches today's sessions on mount.
 * Exposes refetch for pull-to-refresh and focus refetch.
 * Prevents duplicate concurrent requests.
 */

import { useCallback, useEffect, useRef } from 'react';
import { getTodayInstances } from '../services';
import { setLoadingSessions, setSessionsError, setTodaySessions, useTeacherStore } from '../store/use-teacher-store';

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

export function useTodaySessions(): UseTodaySessionsResult {
  const isFetchingRef = useRef(false);

  const fetchSessions = useCallback(async () => {
    // Prevent duplicate concurrent requests
    if (isFetchingRef.current)
      return;
    isFetchingRef.current = true;

    try {
      // Only show loading spinner when there's no data yet
      const { todaySessions } = useTeacherStore.getState();
      if (todaySessions.length === 0) {
        setLoadingSessions(true);
      }
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
      isFetchingRef.current = false;
    }
  }, []);

  // Fetch on mount only
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { refetch: fetchSessions };
}
