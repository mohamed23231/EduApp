import type { CreateSessionInput, SessionInstance, SessionTemplate, Student, UpdateSessionInput } from '../types';
import type { ApiSuccess } from '@/shared/types/api';
import { client } from '@/lib/api/client';
import { unwrapData } from '@/shared/services/api-utils';

type BackendSessionInstance = {
  id: string;
  templateId: string;
  subject: string;
  date: string;
  time: string;
  state: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  studentCount: number;
  attendanceSummary?: {
    present: number;
    absent: number;
    excused: number;
  } | null;
};

type BackendSessionTemplate = {
  id: string;
  subject: string;
  daysOfWeek: number[];
  time: string;
  studentIds: string[];
};

type BackendStudent = {
  id: string;
  name: string;
  gradeLevel?: string | null;
  notes?: string | null;
};

function mapBackendSessionInstance(instance: BackendSessionInstance): SessionInstance {
  return {
    id: instance.id,
    templateId: instance.templateId,
    subject: instance.subject,
    date: instance.date,
    time: instance.time,
    state: instance.state,
    studentCount: instance.studentCount,
    attendanceSummary: instance.attendanceSummary ?? undefined,
  };
}

function mapBackendSessionTemplate(template: BackendSessionTemplate): SessionTemplate {
  return {
    id: template.id,
    subject: template.subject,
    daysOfWeek: template.daysOfWeek,
    time: template.time,
    studentIds: template.studentIds,
  };
}

function mapBackendStudent(student: BackendStudent): Student {
  return {
    id: student.id,
    name: student.name,
    gradeLevel: student.gradeLevel ?? undefined,
    notes: student.notes ?? undefined,
  };
}

/**
 * Get today's session instances
 * @param date - Date in YYYY-MM-DD format (local timezone)
 */
export async function getTodayInstances(date: string): Promise<SessionInstance[]> {
  const response = await client.get<ApiSuccess<BackendSessionInstance[]> | BackendSessionInstance[]>(`/api/session-instances?date=${date}`);
  const instances = unwrapData<BackendSessionInstance[]>(response.data);
  return instances.map(mapBackendSessionInstance);
}

export async function getInstanceDetail(id: string): Promise<SessionInstance> {
  const response = await client.get<ApiSuccess<BackendSessionInstance> | BackendSessionInstance>(`/api/session-instances/${id}`);
  const instance = unwrapData<BackendSessionInstance>(response.data);
  return mapBackendSessionInstance(instance);
}

export async function startSession(id: string): Promise<SessionInstance> {
  const response = await client.post<ApiSuccess<BackendSessionInstance> | BackendSessionInstance>(`/api/session-instances/${id}/start`);
  const instance = unwrapData<BackendSessionInstance>(response.data);
  return mapBackendSessionInstance(instance);
}

export async function createTemplate(data: CreateSessionInput): Promise<SessionTemplate> {
  const response = await client.post<ApiSuccess<BackendSessionTemplate> | BackendSessionTemplate>('/api/session-templates', data);
  const template = unwrapData<BackendSessionTemplate>(response.data);
  return mapBackendSessionTemplate(template);
}

export async function getTemplate(id: string): Promise<SessionTemplate> {
  const response = await client.get<ApiSuccess<BackendSessionTemplate> | BackendSessionTemplate>(`/api/session-templates/${id}`);
  const template = unwrapData<BackendSessionTemplate>(response.data);
  return mapBackendSessionTemplate(template);
}

export async function updateTemplate(id: string, data: UpdateSessionInput): Promise<SessionTemplate> {
  const response = await client.patch<ApiSuccess<BackendSessionTemplate> | BackendSessionTemplate>(`/api/session-templates/${id}`, data);
  const template = unwrapData<BackendSessionTemplate>(response.data);
  return mapBackendSessionTemplate(template);
}

export async function deleteTemplate(id: string): Promise<void> {
  await client.delete(`/api/session-templates/${id}`);
}

export async function getAvailableStudents(templateId: string): Promise<Student[]> {
  const response = await client.get<ApiSuccess<BackendStudent[]> | BackendStudent[]>(`/api/session-templates/${templateId}/available-students`);
  const students = unwrapData<BackendStudent[]>(response.data);
  return students.map(mapBackendStudent);
}

export async function assignStudents(templateId: string, studentIds: string[]): Promise<void> {
  await client.post(`/api/session-templates/${templateId}/students`, { studentIds });
}

export async function removeStudents(templateId: string, studentIds: string[]): Promise<void> {
  await client.delete(`/api/session-templates/${templateId}/students`, { data: { studentIds } });
}
