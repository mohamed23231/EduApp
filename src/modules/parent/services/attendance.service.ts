import type { AttendanceRecord } from '../types/student.types';
import type { ApiSuccess } from '@/shared/types/api';
import { client } from '@/lib/api/client';

type BackendAttendanceTimelineRecord = {
  date: string;
  time: string;
  status: AttendanceRecord['status'] | string | null;
};

type BackendAttendanceTimelineResponse = {
  records: BackendAttendanceTimelineRecord[];
};

function unwrapData<T>(payload: ApiSuccess<T> | T): T {
  if (
    payload
    && typeof payload === 'object'
    && 'success' in (payload as Record<string, unknown>)
    && 'data' in (payload as Record<string, unknown>)
  ) {
    return (payload as ApiSuccess<T>).data;
  }
  return payload as T;
}

function normalizeAttendanceStatus(
  status: BackendAttendanceTimelineRecord['status'],
): AttendanceRecord['status'] {
  if (
    status === 'PRESENT'
    || status === 'ABSENT'
    || status === 'EXCUSED'
    || status === 'NOT_MARKED'
  ) {
    return status;
  }
  return 'NOT_MARKED';
}

export async function fetchAttendance(studentId: string): Promise<AttendanceRecord[]> {
  const response = await client.get<ApiSuccess<BackendAttendanceTimelineResponse> | BackendAttendanceTimelineResponse>(
    `/parents/students/${studentId}/attendance/timeline`,
  );
  const timeline = unwrapData<BackendAttendanceTimelineResponse>(response.data);
  return timeline.records.map(record => ({
    sessionDate: record.date,
    sessionName: record.time ? `Session ${record.time}` : 'Session',
    status: normalizeAttendanceStatus(record.status),
  }));
}
