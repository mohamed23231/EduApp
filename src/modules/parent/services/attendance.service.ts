import type { AttendanceRecord, AttendanceStats, AttendanceStatus, TimelineRecord } from '../types/student.types';
import type { ApiSuccess } from '@/shared/types/api';
import { client } from '@/lib/api/client';
import { unwrapData } from '@/shared/services/api-utils';

// Backend response types
type BackendAttendanceStats = {
  studentId?: string;
  studentName?: string;
  termId?: string;
  termName?: string;
  termStartDate?: string;
  termEndDate?: string;
  totalSessions?: number | string;
  present?: number | string;
  absent?: number | string;
  excused?: number | string;
  notMarked?: number | string;
  attendanceRate?: number | string;
};

type BackendTimelineRecord = {
  sessionInstanceId?: string;
  date: string;
  time: string;
  status: string | null;
  excuseNote?: string | null;
};

type BackendTimelineResponse = {
  studentId?: string;
  studentName?: string;
  termId?: string;
  records: BackendTimelineRecord[];
  page?: number;
  limit?: number;
  totalRecords?: number;
  totalPages?: number;
};

export function normalizeAttendanceStatus(status: string | null | undefined): AttendanceStatus {
  if (status === 'PRESENT' || status === 'ABSENT' || status === 'EXCUSED' || status === 'NOT_MARKED') {
    return status;
  }
  return 'NOT_MARKED';
}

export function mapAttendanceStats(data: BackendAttendanceStats): AttendanceStats {
  const rawRate = Number.parseFloat(String(data.attendanceRate ?? 0));
  const attendanceRate = Math.min(100, Math.max(0, Number.isNaN(rawRate) ? 0 : rawRate));

  const parseCount = (val: number | string | undefined): number => {
    const parsed = Number.parseInt(String(val ?? 0), 10);
    return Math.max(0, Math.floor(Number.isNaN(parsed) ? 0 : parsed));
  };

  return {
    attendanceRate,
    present: parseCount(data.present),
    absent: parseCount(data.absent),
    excused: parseCount(data.excused),
    notMarked: parseCount(data.notMarked),
    totalSessions: parseCount(data.totalSessions),
    termName: data.termName ?? '',
    termStartDate: data.termStartDate ?? '',
    termEndDate: data.termEndDate ?? '',
  };
}

export function mapTimelineRecord(record: BackendTimelineRecord): TimelineRecord {
  const status = normalizeAttendanceStatus(record.status);
  const mapped: TimelineRecord = {
    date: record.date,
    time: record.time,
    status,
  };
  // Only include excuseNote when status is EXCUSED
  if (status === 'EXCUSED' && record.excuseNote) {
    mapped.excuseNote = record.excuseNote;
  }
  return mapped;
}

export async function fetchAttendanceStats(studentId: string): Promise<AttendanceStats> {
  const response = await client.get<ApiSuccess<BackendAttendanceStats> | BackendAttendanceStats>(
    `/parents/students/${studentId}/attendance/statistics`,
  );
  const data = unwrapData(response.data);
  return mapAttendanceStats(data);
}

export async function fetchAttendanceTimeline(
  studentId: string,
  page: number = 1,
  limit: number = 10,
): Promise<TimelineRecord[]> {
  const response = await client.get<ApiSuccess<BackendTimelineResponse> | BackendTimelineResponse>(
    `/parents/students/${studentId}/attendance/timeline`,
    { params: { page, limit } },
  );
  const data = unwrapData(response.data);
  return data.records.map(mapTimelineRecord);
}

// Keep for backward compatibility
export async function fetchAttendance(studentId: string): Promise<AttendanceRecord[]> {
  const timeline = await fetchAttendanceTimeline(studentId);
  return timeline.map(record => ({
    sessionDate: record.date,
    sessionName: record.time ? `Session ${record.time}` : 'Session',
    status: record.status,
  }));
}
