import type { ApiSuccess } from '@/shared/types/api';
import { client } from '@/lib/api/client';
import { unwrapData } from '@/shared/services/api-utils';

export type TeacherOrgInstance = {
  id: string;
  templateId: string;
  date: string;
  time: string;
  durationMinutes: number;
  organizationId: string;
  state: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'CANCELLED';
  subject: string;
  studentCount: number;
  students: Array<{ id: string; name: string }>;
  assignedTeacher: { id: string; name: string };
  startedAt: string | null;
  endedAt: string | null;
};

type PaginatedResponse<T> = { data: T[]; meta: { total: number; page: number; limit: number } };

export async function listMyOrgInstances(orgId: string, query?: Record<string, string | number | boolean | undefined>) {
  const params = new URLSearchParams();
  Object.entries(query ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== '') {
      params.set(k, String(v));
    }
  });
  const qs = params.toString();
  const path = `/orgs/${orgId}/instances/mine${qs ? `?${qs}` : ''}`;
  const response = await client.get<ApiSuccess<PaginatedResponse<TeacherOrgInstance>> | PaginatedResponse<TeacherOrgInstance>>(path);
  return unwrapData(response.data);
}

export async function startOrgInstance(orgId: string, instanceId: string) {
  const response = await client.post<ApiSuccess<TeacherOrgInstance> | TeacherOrgInstance>(`/orgs/${orgId}/instances/${instanceId}/start`);
  return unwrapData(response.data);
}

export async function closeOrgInstance(orgId: string, instanceId: string) {
  const response = await client.post<ApiSuccess<unknown> | unknown>(`/orgs/${orgId}/instances/${instanceId}/close`);
  return unwrapData(response.data);
}

export type MarkAttendanceEntry = {
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED';
  rating?: number;
  excuseNote?: string;
};

export async function markOrgAttendance(orgId: string, instanceId: string, records: MarkAttendanceEntry[]) {
  const response = await client.post<ApiSuccess<unknown> | unknown>(`/orgs/${orgId}/instances/${instanceId}/attendance`, { records });
  return unwrapData(response.data);
}
