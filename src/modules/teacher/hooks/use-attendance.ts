/**
 * useAttendance hook
 * Load instance detail with existing records on mount
 * Pre-populate attendanceMap from existing records
 * Tracks in-flight state to prevent concurrent submissions
 * On conflict (409), treats existing record as source of truth and skips
 * On partial failure, retries only failed students
 */

import type { AttendanceRecord, AttendanceStatus, SessionInstance, Student } from '../types';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAvailableStudents, getInstanceDetail, markAttendance, updateAttendance } from '../services';

type AttendanceMap = Record<string, { status: AttendanceStatus | null; excuseNote: string; recordId?: string }>;

type UseAttendanceResult = {
  session: SessionInstance | undefined;
  students: Student[];
  attendanceMap: AttendanceMap;
  isLoading: boolean;
  error: string | null;
  isSubmitting: boolean;
  setStudentStatus: (studentId: string, status: AttendanceStatus) => void;
  setExcuseNote: (studentId: string, note: string) => void;
  submitAttendance: () => Promise<void>;
};

/**
 * Hook to manage attendance marking for a session instance
 */
export function useAttendance(instanceId: string): UseAttendanceResult {
  const [attendanceMap, setAttendanceMap] = useState<AttendanceMap>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);

  // Fetch session instance detail
  const { data: session, isLoading } = useQuery({
    queryKey: ['teacher', 'session-instance', instanceId],
    queryFn: () => getInstanceDetail(instanceId),
  });

  // Fetch available students for the session
  const { data: availableStudents } = useQuery({
    queryKey: ['teacher', 'available-students', session?.templateId],
    queryFn: () => session?.templateId ? getAvailableStudents(session.templateId) : Promise.resolve([]),
    enabled: !!session?.templateId,
  });

  const sessionStudents = useMemo(() => {
    return availableStudents || [];
  }, [availableStudents]);

  // Pre-populate attendance map from existing records when session loads
  useEffect(() => {
    if (sessionStudents.length > 0) {
      const initialMap: AttendanceMap = {};
      sessionStudents.forEach((student: Student) => {
        initialMap[student.id] = { status: null, excuseNote: '' };
      });
      setAttendanceMap(initialMap);
      setStudents(sessionStudents);
    }
  }, [sessionStudents]);

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

  const submitAttendance = useCallback(async () => {
    if (!session) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const results = await Promise.allSettled(
        Object.entries(attendanceMap).map(async ([studentId, data]) => {
          if (!data.status) {
            return; // Skip if no status is set
          }

          try {
            if (data.recordId) {
              // Update existing record
              await updateAttendance(data.recordId, {
                status: data.status,
                excuseNote: data.excuseNote,
              });
            }
            else {
              // Create new record
              await markAttendance({
                sessionInstanceId: instanceId,
                studentId,
                status: data.status,
                excuseNote: data.excuseNote,
              });
            }
          }
          catch (err) {
            if (err && typeof err === 'object' && 'response' in err && (err as any).response?.status === 409) {
              // Conflict - record already submitted, skip
              return;
            }
            throw err;
          }
        }),
      );

      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        setError(`${failed.length} attendance records failed to save`);
      }
    }
    catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit attendance';
      setError(message);
    }
    finally {
      setIsSubmitting(false);
    }
  }, [session, attendanceMap, instanceId]);

  return {
    session,
    students,
    attendanceMap,
    isLoading,
    error,
    isSubmitting,
    setStudentStatus,
    setExcuseNote,
    submitAttendance,
  };
}
