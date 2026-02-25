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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { getInstanceDetail, markAttendance, updateAttendance } from '../services';
import { getTeacherIdHash, trackAttendanceSubmitted } from '../services/analytics.service';

type AttendanceMap = Record<string, { status: AttendanceStatus | null; excuseNote: string; recordId?: string }>;

type UseAttendanceResult = {
  session: SessionInstance | undefined;
  students: Student[];
  attendanceMap: AttendanceMap;
  isLoading: boolean;
  error: string | null;
  isSubmitting: boolean;
  markedCount: number;
  totalCount: number;
  setStudentStatus: (studentId: string, status: AttendanceStatus) => void;
  setExcuseNote: (studentId: string, note: string) => void;
  markAllPresent: () => void;
  submitAttendance: () => Promise<void>;
};

/** Submit a single student's attendance record, treating 409 as success */
async function submitSingleRecord(
  entry: { studentId: string; data: { status: AttendanceStatus | null; excuseNote: string; recordId?: string } },
  instanceId: string,
) {
  const { studentId, data } = entry;
  if (!data.status)
    return;

  try {
    if (data.recordId) {
      await updateAttendance(data.recordId, { status: data.status, excuseNote: data.excuseNote });
    }
    else {
      await markAttendance({ sessionInstanceId: instanceId, studentId, status: data.status, excuseNote: data.excuseNote });
    }
  }
  catch (err) {
    if (err && typeof err === 'object' && 'response' in err && (err as any).response?.status === 409) {
      return; // Conflict - record already submitted, skip
    }
    throw err;
  }
}

/** Build initial attendance map from student list */
function buildInitialMap(students: Student[]): AttendanceMap {
  const map: AttendanceMap = {};
  students.forEach((student: Student) => {
    map[student.id] = { status: null, excuseNote: '' };
  });
  return map;
}

/**
 * Hook to manage attendance marking for a session instance
 */
export function useAttendance(instanceId: string): UseAttendanceResult {
  const [attendanceMap, setAttendanceMap] = useState<AttendanceMap>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const user = useAuthStore.use.user();
  const queryClient = useQueryClient();

  // Fetch session instance detail (includes assignedStudents + attendanceRecords)
  const { data: session, isLoading } = useQuery({
    queryKey: ['teacher', 'session-instance', instanceId],
    queryFn: () => getInstanceDetail(instanceId),
    enabled: !!instanceId,
  });

  // Use students from the session instance directly
  const sessionStudents = useMemo(() => {
    return session?.assignedStudents ?? [];
  }, [session?.assignedStudents]);

  // Pre-populate attendance map from existing records when session loads
  useEffect(() => {
    if (sessionStudents.length > 0) {
      const map = buildInitialMap(sessionStudents);

      // Overlay existing attendance records so reopening the sheet
      // shows what was already saved instead of resetting everything.
      if (session?.attendanceRecords) {
        session.attendanceRecords.forEach((record) => {
          if (map[record.studentId]) {
            map[record.studentId] = {
              status: record.status,
              excuseNote: record.excuseNote ?? '',
              recordId: record.id,
            };
          }
        });
      }

      setAttendanceMap(map);
      setStudents(sessionStudents);
    }
  }, [sessionStudents, session?.attendanceRecords]);

  const setStudentStatus = useCallback((studentId: string, status: AttendanceStatus) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  }, []);

  const setExcuseNote = useCallback((studentId: string, note: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], excuseNote: note },
    }));
  }, []);

  const markAllPresent = useCallback(() => {
    setAttendanceMap((prev) => {
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        if (!next[id].status) {
          next[id] = { ...next[id], status: 'PRESENT' };
        }
      }
      return next;
    });
  }, []);

  const markedCount = useMemo(
    () => Object.values(attendanceMap).filter(a => a.status !== null).length,
    [attendanceMap],
  );
  const totalCount = students.length;

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
        setError(`${failed.length} attendance records failed to save`);
      }
      else {
        // Invalidate cache so next open fetches fresh records
        await queryClient.invalidateQueries({ queryKey: ['teacher', 'session-instance', instanceId] });

        if (user?.id && session) {
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
      setError(err instanceof Error ? err.message : 'Failed to submit attendance');
    }
    finally {
      setIsSubmitting(false);
    }
  }, [session, attendanceMap, instanceId, user, queryClient]);

  return {
    session,
    students,
    attendanceMap,
    isLoading,
    error,
    isSubmitting,
    markedCount,
    totalCount,
    setStudentStatus,
    setExcuseNote,
    markAllPresent,
    submitAttendance,
  };
}
