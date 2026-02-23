/**
 * Teacher module domain types
 * Validates: Requirements 1.4, 2.2, 2.3, 3.2, 3.3, 5.1, 7.2, 10.4, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.8, 11.9, 12.2, 13.1, 13.4, 14.1, 14.2, 14.4, 14.5, 14.6, 15.1, 15.2, 15.3, 17.1, 17.2, 26.1, 26.2, 26.4
 */

// Attendance status types
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'EXCUSED';

// Session state types
export type SessionState = 'DRAFT' | 'ACTIVE' | 'CLOSED';

// Student types
export type Student = {
  id: string;
  name: string;
  gradeLevel?: string;
  notes?: string;
};

export type AccessCode = {
  code: string;
  createdAt: string;
  expiresAt?: string;
};

// Session types
export type SessionInstance = {
  id: string;
  templateId: string;
  subject: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  state: SessionState;
  studentCount: number;
  attendanceSummary?: {
    present: number;
    absent: number;
    excused: number;
  };
};

export type SessionTemplate = {
  id: string;
  subject: string;
  daysOfWeek: number[]; // 1-7 (Mon-Sun)
  time: string; // HH:mm
  studentIds: string[];
};

// Attendance types
export type AttendanceRecord = {
  id: string;
  studentId: string;
  sessionInstanceId: string;
  status: AttendanceStatus;
  excuseNote?: string;
  markedAt: string;
};

// Input types
export type CreateStudentInput = {
  name: string;
  gradeLevel?: string;
  notes?: string;
};

export type UpdateStudentInput = {
  name?: string;
  gradeLevel?: string;
  notes?: string;
};

export type CreateSessionInput = {
  subject: string;
  daysOfWeek: number[];
  time: string;
  studentIds: string[];
};

export type UpdateSessionInput = {
  subject?: string;
  daysOfWeek?: number[];
  time?: string;
  studentIds?: string[];
};

export type MarkAttendanceInput = {
  sessionInstanceId: string;
  studentId: string;
  status: AttendanceStatus;
  excuseNote?: string;
};

export type UpdateAttendanceInput = {
  status?: AttendanceStatus;
  excuseNote?: string;
};

export type PaginatedStudents = {
  students: Student[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};
