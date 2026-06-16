/**
 * useAttendance hook
 * Load instance detail with existing records on mount
 * Pre-populate attendanceMap from existing records
 * Tracks in-flight state to prevent concurrent submissions
 * On conflict (409), treats existing record as source of truth and skips
 * On partial failure, retries only failed students
 */

import type { AttendanceStatus, SessionInstance, Student } from '../types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { getApiErrorMessage, isApiError } from '@/shared/services/api-utils';
import { getInstanceDetail, markAttendance, updateAttendance } from '../services';
import { getTeacherIdHash, trackAttendanceSubmitted } from '../services/analytics.service';

type AttendanceEntry = { status: AttendanceStatus | null; excuseNote: string; rating: number | null; recordId?: string };
type AttendanceMap = Record<string, AttendanceEntry>;

type UseAttendanceResult = {
  session: SessionInstance | undefined;
  students: Student[];
  attendanceMap: AttendanceMap;
  isLoading: boolean;
  isError: boolean;
  loadError: unknown;
  refetch: () => void;
  error: string | null;
  isSubmitting: boolean;
  markedCount: number;
  totalCount: number;
  unratedCount: number;
  setStudentStatus: (studentId: string, status: AttendanceStatus) => void;
  setExcuseNote: (studentId: string, note: string) => void;
  setStudentRating: (studentId: string, rating: number | null) => void;
  markAllPresent: () => void;
  applyBatchRating: (rating: number) => void;
  submitAttendance: () => Promise<void>;
};

/** Submit a single student's attendance record, treating 409 as success */
async function submitSingleRecord(
  entry: { studentId: string; data: AttendanceEntry },
  instanceId: string,
) {
  const { studentId, data } = entry;
  if (!data.status)
    return;

  try {
    if (data.recordId) {
      await updateAttendance(data.recordId, { status: data.status, excuseNote: data.excuseNote, rating: data.rating });
    }
    else {
      await markAttendance({ sessionInstanceId: instanceId, studentId, status: data.status, excuseNote: data.excuseNote, rating: data.rating ?? undefined });
    }
  }
  catch (err) {
    if (isApiError(err) && err.response?.status === 409)
      return;
    throw err;
  }
}

/** Build attendance map from students and existing records */
function buildAttendanceMap(students: Student[], records?: SessionInstance['attendanceRecords']): AttendanceMap {
  const map: AttendanceMap = {};
  for (const s of students) {
    map[s.id] = { status: null, excuseNote: '', rating: null };
  }
  if (records) {
    for (const r of records) {
      if (map[r.studentId]) {
        map[r.studentId] = { status: r.status, excuseNote: r.excuseNote ?? '', rating: r.rating ?? null, recordId: r.id };
      }
    }
  }
  return map;
}

/** Create attendance map setters */
function useAttendanceSetters(setAttendanceMap: React.Dispatch<React.SetStateAction<AttendanceMap>>) {
  const setStudentStatus = useCallback((studentId: string, status: AttendanceStatus) => {
    setAttendanceMap(prev => ({ ...prev, [studentId]: { ...prev[studentId], status } }));
  }, [setAttendanceMap]);

  const setExcuseNote = useCallback((studentId: string, note: string) => {
    setAttendanceMap(prev => ({ ...prev, [studentId]: { ...prev[studentId], excuseNote: note } }));
  }, [setAttendanceMap]);

  const setStudentRating = useCallback((studentId: string, rating: number | null) => {
    setAttendanceMap(prev => ({ ...prev, [studentId]: { ...prev[studentId], rating } }));
  }, [setAttendanceMap]);

  const markAllPresent = useCallback(() => {
    setAttendanceMap((prev) => {
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        if (!next[id].status)
          next[id] = { ...next[id], status: 'PRESENT' };
      }
      return next;
    });
  }, [setAttendanceMap]);

  const applyBatchRating = useCallback((rating: number) => {
    setAttendanceMap((prev) => {
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        if (next[id].rating === null)
          next[id] = { ...next[id], rating };
      }
      return next;
    });
  }, [setAttendanceMap]);

  return { setStudentStatus, setExcuseNote, setStudentRating, markAllPresent, applyBatchRating };
}

export function useAttendance(instanceId: string): UseAttendanceResult {
  const { t } = useTranslation();
  const [attendanceMap, setAttendanceMap] = useState<AttendanceMap>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore.use.user();
  const queryClient = useQueryClient();
  const [prevSyncKey, setPrevSyncKey] = useState<string | null>(null);

  const { data: session, isLoading, isError, error: loadError, refetch } = useQuery({
    queryKey: ['teacher', 'session-instance', instanceId],
    queryFn: () => getInstanceDetail(instanceId),
    enabled: !!instanceId,
  });

  const students = useMemo(() => session?.assignedStudents ?? [], [session?.assignedStudents]);
  const setters = useAttendanceSetters(setAttendanceMap);

  // Derive attendance map from session data, only rebuild when session changes
  const derivedMap = useMemo(() => {
    if (!session?.id || students.length === 0)
      return null;
    return buildAttendanceMap(students, session.attendanceRecords);
  }, [session?.id, session?.attendanceRecords, students]);

  // Stable key over server records — changes when the session or any server-side
  // record (id/status) changes, so pull-to-refresh re-syncs even on the same session.
  const recordsKey = useMemo(
    () => (session?.attendanceRecords ?? []).map(r => `${r.id}:${r.status}`).join(','),
    [session?.attendanceRecords],
  );

  // Sync derived map to state when session ID OR server records change.
  // Uses React's "adjust state during render" pattern (not an effect) so we avoid
  // a direct setState-in-useEffect + the extra commit. The syncKey guard makes the
  // set run at most once per server change. Re-init reflects server truth — an
  // unsaved local edit made during a concurrent server-side change is replaced.
  const syncKey = derivedMap && session?.id ? `${session.id}|${recordsKey}` : null;
  if (derivedMap && syncKey !== null && syncKey !== prevSyncKey) {
    setPrevSyncKey(syncKey);
    setAttendanceMap(derivedMap);
  }

  const unratedCount = useMemo(() => Object.values(attendanceMap).filter(a => a.status !== null && a.rating === null).length, [attendanceMap]);
  const markedCount = useMemo(() => Object.values(attendanceMap).filter(a => a.status !== null).length, [attendanceMap]);

  const submitAttendance = useCallback(async () => {
    if (!session)
      return;
    setIsSubmitting(true);
    setError(null);

    try {
      const entries = Object.entries(attendanceMap).map(([studentId, data]) => ({ studentId, data }));
      const results = await Promise.allSettled(entries.map(e => submitSingleRecord(e, instanceId)));
      const failed = results.filter(r => r.status === 'rejected');

      if (failed.length > 0) {
        setError(t('teacher.attendance.partialFailure', '{{count}} attendance records failed to save', { count: failed.length }));
      }
      else {
        await queryClient.invalidateQueries({ queryKey: ['teacher', 'session-instance', instanceId] });
        if (user?.id) {
          const counts = {
            present: Object.values(attendanceMap).filter(a => a.status === 'PRESENT').length,
            absent: Object.values(attendanceMap).filter(a => a.status === 'ABSENT').length,
            excused: Object.values(attendanceMap).filter(a => a.status === 'EXCUSED').length,
          };
          trackAttendanceSubmitted(getTeacherIdHash(user.id), session.id, counts);
        }
      }
    }
    catch (err) {
      console.error('[useAttendance] submit failed', err);
      setError(getApiErrorMessage(err, t('teacher.attendance.submitFailed', 'Failed to submit attendance')));
    }
    finally {
      setIsSubmitting(false);
    }
  }, [session, attendanceMap, instanceId, user, queryClient, t]);

  return {
    session,
    students,
    attendanceMap,
    isLoading,
    isError,
    loadError,
    refetch,
    error,
    isSubmitting,
    markedCount,
    totalCount: students.length,
    unratedCount,
    submitAttendance,
    ...setters,
  };
}
