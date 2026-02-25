import type { AttendanceRecord, MarkAttendanceInput, UpdateAttendanceInput } from '../types';
import type { ApiSuccess } from '@/shared/types/api';
import { authClient } from '@/lib/api/client';
import { unwrapData } from '@/shared/services/api-utils';

type BackendAttendanceRecord = {
  id: string;
  studentId: string;
  sessionInstanceId: string;
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED';
  excuseNote?: string | null;
  rating: number | null;
  createdAt: string;
};

function mapBackendAttendanceRecord(record: BackendAttendanceRecord): AttendanceRecord {
  return {
    id: record.id,
    studentId: record.studentId,
    sessionInstanceId: record.sessionInstanceId,
    status: record.status,
    excuseNote: record.excuseNote ?? null,
    rating: record.rating ?? null,
    createdAt: record.createdAt,
  };
}

export async function markAttendance(data: MarkAttendanceInput): Promise<AttendanceRecord> {
  const response = await authClient.post<ApiSuccess<BackendAttendanceRecord> | BackendAttendanceRecord>('/attendance', data);
  const record = unwrapData<BackendAttendanceRecord>(response.data);
  return mapBackendAttendanceRecord(record);
}

export async function updateAttendance(id: string, data: UpdateAttendanceInput): Promise<AttendanceRecord> {
  const response = await authClient.patch<ApiSuccess<BackendAttendanceRecord> | BackendAttendanceRecord>(`/attendance/${id}`, data);
  const record = unwrapData<BackendAttendanceRecord>(response.data);
  return mapBackendAttendanceRecord(record);
}
