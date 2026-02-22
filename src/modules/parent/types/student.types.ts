/**
 * Parent module domain types for student data
 * Validates: Requirements 8.3, 9.1, 10.1, 11.1, 12.2, 12.6
 */

export type Student = {
  id: string;
  fullName: string;
  avatarUrl?: string;
  grade?: string;
  schoolName?: string;
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
};

export type LinkStudentRequest = {
  accessCode: string;
};
