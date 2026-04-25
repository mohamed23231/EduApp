/**
 * useOrgAttendance hook
 * Load org instance details and manage attendance state.
 * Pre-populates attendanceMap from existing records on load.
 * Submits via markOrgAttendance bulk endpoint.
 */

import type { MarkAttendanceInput, OrgAttendanceRecord, OrgSessionInstance } from '../types/manager.types';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { markOrgAttendance } from '../services/org-api.service';
import { ManagerQueryKey, useOrgInstance } from './use-manager-org';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'EXCUSED';

type AttendanceEntry = {
  status: AttendanceStatus | null;
  excuseNote: string;
  rating: number | null;
};

type AttendanceMap = Record<string, AttendanceEntry>;

type OrgStudent = {
  id: string;
  name: string;
  gradeLevel?: string | null;
};

type UseOrgAttendanceResult = {
  instance: OrgSessionInstance | undefined;
  students: OrgStudent[];
  attendanceMap: AttendanceMap;
  isLoading: boolean;
  error: string | null;
  isSubmitting: boolean;
  markedCount: number;
  totalCount: number;
  setStudentStatus: (studentId: string, status: AttendanceStatus) => void;
  setExcuseNote: (studentId: string, note: string) => void;
  setStudentRating: (studentId: string, rating: number | null) => void;
  submitAttendance: () => Promise<void>;
};

function buildAttendanceMap(
  students: OrgStudent[],
  records?: OrgAttendanceRecord[],
): AttendanceMap {
  const map: AttendanceMap = {};
  for (const s of students) {
    map[s.id] = { status: null, excuseNote: '', rating: null };
  }
  if (records) {
    for (const r of records) {
      if (map[r.studentId]) {
        map[r.studentId] = {
          status: r.status,
          excuseNote: r.excuseNote ?? '',
          rating: r.rating ?? null,
        };
      }
    }
  }
  return map;
}

// eslint-disable-next-line max-lines-per-function
export function useOrgAttendance(
  orgId: string,
  instanceId: string,
): UseOrgAttendanceResult {
  const [attendanceMap, setAttendanceMap] = useState<AttendanceMap>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const prevInstanceRef = useRef<string | null>(null);

  const { data: instance, isLoading } = useOrgInstance(orgId, instanceId);

  const students = useMemo<OrgStudent[]>(
    () => instance?.students ?? [],
    [instance?.students],
  );

  const derivedMap = useMemo(() => {
    if (!instance?.id || students.length === 0)
      return null;
    return buildAttendanceMap(students, instance.attendanceRecords);
  }, [instance?.id, instance?.attendanceRecords, students]);

  useEffect(() => {
    if (!derivedMap || !instance?.id || instance.id === prevInstanceRef.current) {
      return;
    }
    prevInstanceRef.current = instance.id;
    setAttendanceMap(derivedMap);
  }, [derivedMap, instance?.id]);

  const markedCount = useMemo(
    () => Object.values(attendanceMap).filter(a => a.status !== null).length,
    [attendanceMap],
  );

  const totalCount = students.length;

  const setStudentStatus = useCallback(
    (studentId: string, status: AttendanceStatus) => {
      setAttendanceMap(prev => ({
        ...prev,
        [studentId]: { ...prev[studentId], status },
      }));
    },
    [],
  );

  const setExcuseNote = useCallback(
    (studentId: string, note: string) => {
      setAttendanceMap(prev => ({
        ...prev,
        [studentId]: { ...prev[studentId], excuseNote: note },
      }));
    },
    [],
  );

  const setStudentRating = useCallback(
    (studentId: string, rating: number | null) => {
      setAttendanceMap(prev => ({
        ...prev,
        [studentId]: { ...prev[studentId], rating },
      }));
    },
    [],
  );

  const submitAttendance = useCallback(async () => {
    if (!instance)
      return;
    setIsSubmitting(true);
    setError(null);

    try {
      const records: MarkAttendanceInput['records'] = [];
      for (const [studentId, entry] of Object.entries(attendanceMap)) {
        if (entry.status) {
          records.push({
            studentId,
            status: entry.status,
            excuseNote: entry.excuseNote || undefined,
            rating: entry.rating ?? undefined,
          });
        }
      }

      await markOrgAttendance(orgId, instanceId, { records });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ManagerQueryKey.instances(orgId),
        }),
        queryClient.invalidateQueries({
          queryKey: ManagerQueryKey.instance(orgId, instanceId),
        }),
      ]);
    }
    catch (err) {
      const message
        = err instanceof Error ? err.message : 'Failed to submit attendance';
      setError(message);
      throw err;
    }
    finally {
      setIsSubmitting(false);
    }
  }, [instance, attendanceMap, orgId, instanceId, queryClient]);

  return {
    instance,
    students,
    attendanceMap,
    isLoading,
    error,
    isSubmitting,
    markedCount,
    totalCount,
    setStudentStatus,
    setExcuseNote,
    setStudentRating,
    submitAttendance,
  };
}
