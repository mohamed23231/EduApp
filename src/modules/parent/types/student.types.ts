/**
 * Parent module domain types for student data
 * Validates: Requirements 8.3, 9.1, 10.1, 11.1, 12.2, 12.6
 */

export type Student = {
  id: string;
  fullName: string;
  gradeLevel?: string;
  teacherName?: string;
  connectionCode?: string;
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
