/**
 * Parent module domain types for student data
 * Validates: Requirements 8.3, 9.1, 10.1, 11.1, 12.2, 12.6
 */

/**
 * Per-student link status surfaced by `GET /parents/students`.
 * `'unlinked'` children are revoked/no-longer-linked but still returned (with
 * `includeUnlinked=true`) so the parent keeps read-only access to past records.
 * `'pending'` does NOT exist in the contract — do not handle it.
 */
export type LinkStatus = 'linked' | 'unlinked';

export type Student = {
  id: string;
  fullName: string;
  gradeLevel?: string;
  teacherName?: string;
  connectionCode?: string;
  /** Optional — omitted by older backend responses, defaults to linked. */
  linkStatus?: LinkStatus;
};

export type StudentDetails = Student & {
  email?: string;
  phone?: string;
  enrollmentDate?: string;
};

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'NOT_MARKED';

export type AttendanceRecord = {
  sessionDate: string;
  sessionName: string;
  status: AttendanceStatus;
  teacherName?: string;
};

export type LinkStudentRequest = {
  accessCode: string;
};

export type AttendanceStats = {
  attendanceRate: number;
  present: number;
  absent: number;
  excused: number;
  notMarked: number;
  totalSessions: number;
  termName: string;
  termStartDate: string;
  termEndDate: string;
  /** Phase 8: optional until backend ships. Consecutive recent days marked PRESENT. */
  currentStreakDays?: number;
  /** Phase 8: optional until backend ships. Mean rating over last 30 days, null when no ratings. */
  avgRating30d?: number | null;
};

export type CurrentSession = {
  inSession: boolean;
  sessionInstanceId?: string;
  sessionName?: string;
  teacherName?: string;
  startedAt?: string;
  room?: string;
};

export type UpcomingSession = {
  sessionInstanceId: string;
  sessionName: string;
  teacherName: string;
  startsAt: string;
  room?: string;
};

export type TimelineRecord = {
  date: string;
  time: string;
  status: AttendanceStatus;
  excuseNote?: string;
};
