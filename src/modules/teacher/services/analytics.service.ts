/**
 * Pluggable analytics interface for teacher module
 * Validates: Requirements 26.1, 26.2, 26.3, 26.4
 */

// Simple hash function for teacher ID (non-cryptographic, for analytics only)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

// Determine if we're in development mode
const isDevelopment = __DEV__;

/**
 * Core track function - logs analytics events
 * In development: console.log with readable format
 * In production: console.log with structured JSON
 */
export function track(eventName: string, properties: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();

  if (isDevelopment) {
    console.log(`[Analytics] ${eventName}`, properties);
  }
  else {
    console.log(JSON.stringify({
      event: eventName,
      properties,
      timestamp,
    }));
  }
}

/**
 * Typed track functions for specific teacher events
 */

export function trackOnboardingCompleted(teacherIdHash: string): void {
  track('teacher_onboarding_completed', {
    teacherIdHash,
  });
}

export function trackStudentCreated(teacherIdHash: string, studentId: string): void {
  track('teacher_student_created', {
    teacherIdHash,
    studentId,
  });
}

export function trackSessionCreated(teacherIdHash: string, sessionTemplateId: string): void {
  track('teacher_session_created', {
    teacherIdHash,
    sessionTemplateId,
  });
}

export function trackAttendanceSubmitted(
  teacherIdHash: string,
  sessionInstanceId: string,
  counts: { present: number; absent: number; excused: number },
): void {
  track('teacher_attendance_submitted', {
    teacherIdHash,
    sessionInstanceId,
    counts,
  });
}

export function trackConnectionCodeShared(teacherIdHash: string, studentId: string): void {
  track('teacher_connection_code_shared', {
    teacherIdHash,
    studentId,
  });
}

/**
 * Utility to get teacher ID hash from raw ID
 * Use this to ensure we never log raw IDs
 */
export function getTeacherIdHash(teacherId: string): string {
  return simpleHash(teacherId);
}
