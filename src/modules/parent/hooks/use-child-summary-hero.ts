import type { AttendanceStats, Student, TimelineRecord } from '../types';
import { useMemo } from 'react';
import { useAttendanceStats } from './use-attendance-stats';
import { useAttendanceTimeline } from './use-attendance-timeline';
import { useStudents } from './use-students';

export type ChildSummaryHero = {
  student: Student | null;
  attendanceStats: AttendanceStats | undefined;
  recentTimeline: TimelineRecord[];
  isLoading: boolean;
  error: Error | null;
};

/**
 * Composites student info, attendance stats, and recent timeline
 * for a given studentId using existing parent hooks.
 * Returns only data already fetched — no new queries.
 */
export function useChildSummaryHero(studentId: string): ChildSummaryHero {
  const {
    data: students,
    isLoading: studentsLoading,
    error: studentsError,
  } = useStudents();

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useAttendanceStats(studentId);

  const {
    data: timeline,
    isLoading: timelineLoading,
    error: timelineError,
  } = useAttendanceTimeline(studentId, 1, 10);

  const student = useMemo(
    () => (studentId && students ? (students.find(s => s.id === studentId) ?? null) : null),
    [students, studentId],
  );

  const recentTimeline = useMemo(
    () => timeline ?? [],
    [timeline],
  );

  const isLoading = studentsLoading || statsLoading || timelineLoading;
  const rawError = studentsError ?? statsError ?? timelineError;
  const error
    = rawError instanceof Error
      ? rawError
      : rawError != null
        ? new Error(String(rawError))
        : null;

  return {
    student,
    attendanceStats: stats,
    recentTimeline,
    isLoading,
    error,
  };
}
