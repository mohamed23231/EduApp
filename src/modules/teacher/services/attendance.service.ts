import type { ApiSuccess } from '@/shared/types/api';
import type { AttendanceRecord, MarkAttendanceInput, UpdateAttendanceInput } from '../types';
import { client } from '@/lib/api/client';
import { unwrapData } from '@/shared/services/api-utils';

type BackendAttendanceRecord = {
  id: string;
  studentId: string;
  sessionInstanceId: string;
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED';
  excuseNote?: string | null;
  markedAt: string;
};

function mapBackendAttendanceRecord(record: BackendAttendanceRecord): AttendanceRecord {
  return {
    id: record.id,
    studentId: record.studentId,
    sessionInstanceId: record.sessionInstanceId,
    status: record.status,
    excuseNote: record.excuseNote ?? undefined,
    markedAt: record.markedAt,
  };
}

export async function markAttendance(data: MarkAttendanceInput): Promise<AttendanceRecord> {
  const response = await client.post<ApiSuccess<BackendAttendanceRecord> | BackendAttendanceRecord>('/api/attendance', data);
  const record = unwrapData<BackendAttendanceRecord>(response.data);
  return mapBackendAttendanceRecord(record);
}

export async function updateAttendance(id: string, data: UpdateAttendanceInput): Promise<AttendanceRecord> {
  const response = await client.patch<ApiSuccess<BackendAttendanceRecord> | BackendAttendanceRecord>(`/api/attendance/${id}`, data);
  const record = unwrapData<BackendAttendanceRecord>(response.data);
  return mapBackendAttendanceRecord(record);
}
