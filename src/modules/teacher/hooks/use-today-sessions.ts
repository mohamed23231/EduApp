/**
 * useTodaySessions hook
 * Fetches today's sessions on mount.
 * Exposes refetch for pull-to-refresh and focus refetch.
 * Prevents duplicate concurrent requests.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getApiErrorMessage } from '@/shared/services/api-utils';
import { getTodayInstances } from '../services';
import { setLoadingSessions, setSessionsError, setTodaySessions, useTeacherStore } from '../store/use-teacher-store';

// Returns today's date (YYYY-MM-DD) in the DEVICE's local timezone.
// Assumption: the backend interprets this date in the teacher's local day, not UTC.
// TODO(backend): confirm GET /sessions/instances/today expects a local-tz date —
// if it expects UTC, a teacher near midnight could see the wrong day's sessions.
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
  const { t } = useTranslation();
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
      console.error('[useTodaySessions] fetch failed', error);
      setSessionsError(getApiErrorMessage(error, t('teacher.common.loadError', 'Failed to load. Please try again.')));
    }
    finally {
      setLoadingSessions(false);
      isFetchingRef.current = false;
    }
  }, [t]);

  // Fetch on mount only
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { refetch: fetchSessions };
}
