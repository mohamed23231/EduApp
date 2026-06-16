/**
 * useStudentSessions hook
 * Fetches session templates and builds a map of studentId → assigned sessions.
 * Used by the enhanced student list to show assignment status.
 */

import { useCallback, useEffect, useState } from 'react';
import { getTemplates } from '../services';

export type StudentSessionInfo = {
  sessionCount: number;
  sessions: { id: string; subject: string }[];
};

type UseStudentSessionsResult = {
  /** Map of studentId → session info */
  sessionMap: Record<string, StudentSessionInfo>;
  /** Set of all student IDs that are assigned to at least one session */
  assignedStudentIds: Set<string>;
  isLoading: boolean;
  error: unknown;
  refetch: () => Promise<void>;
};

export function useStudentSessions(): UseStudentSessionsResult {
  const [sessionMap, setSessionMap] = useState<Record<string, StudentSessionInfo>>({});
  const [assignedStudentIds, setAssignedStudentIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const templates = await getTemplates();
      const map: Record<string, StudentSessionInfo> = {};

      for (const template of templates) {
        for (const student of template.assignedStudents) {
          if (!map[student.id]) {
            map[student.id] = { sessionCount: 0, sessions: [] };
          }
          map[student.id].sessionCount += 1;
          map[student.id].sessions.push({ id: template.id, subject: template.subject });
        }
      }

      setSessionMap(map);
      setAssignedStudentIds(new Set(Object.keys(map)));
    }
    catch (err) {
      // Session info is supplementary — surface the error but don't throw.
      console.error('[useStudentSessions] fetch failed', err);
      setError(err);
    }
    finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return { sessionMap, assignedStudentIds, isLoading, error, refetch: fetchTemplates };
}
