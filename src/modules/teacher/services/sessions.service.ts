import type {
  AttendanceRecord,
  CreateSessionInput,
  SessionInstance,
  SessionInstanceDetail,
  SessionTemplate,
  Student,
  UpdateSessionInput,
} from '../types';
import type { ApiSuccess } from '@/shared/types/api';
import { authClient } from '@/lib/api/client';
import { unwrapData } from '@/shared/services/api-utils';

type BackendSessionInstance = {
  id: string;
  templateId: string;
  template?: {
    id: string;
    subject: string;
  };
  subject?: string;
  date: string;
  time: string;
  state: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  startedAt?: string | null;
  endedAt?: string | null;
  assignedStudents?: BackendStudent[];
  attendanceRecords?: BackendAttendanceRecord[];
  studentCount?: number;
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
  assignedStudents?: BackendStudent[];
};

type BackendStudent = {
  id: string;
  name: string;
  gradeLevel?: string | null;
  notes?: string | null;
};

type BackendAttendanceRecord = {
  id: string;
  sessionInstanceId: string;
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED';
  excuseNote?: string | null;
  rating?: number | null;
  createdAt: string;
};

function mapBackendStudent(student: BackendStudent): Student {
  return {
    id: student.id,
    name: student.name,
    gradeLevel: student.gradeLevel ?? undefined,
    notes: student.notes ?? undefined,
  };
}

function mapBackendAttendanceRecord(record: BackendAttendanceRecord): AttendanceRecord {
  return {
    id: record.id,
    sessionInstanceId: record.sessionInstanceId,
    studentId: record.studentId,
    status: record.status,
    excuseNote: record.excuseNote ?? undefined,
    rating: record.rating ?? null,
    createdAt: record.createdAt,
  };
}

function mapBackendSessionInstance(instance: BackendSessionInstance): SessionInstance {
  const assignedStudents = instance.assignedStudents?.map(mapBackendStudent) ?? [];
  const attendanceRecords = instance.attendanceRecords?.map(mapBackendAttendanceRecord) ?? [];
  const templateId = instance.templateId || instance.template?.id || '';
  const subject = instance.subject || instance.template?.subject || '';

  const attendanceSummary = instance.attendanceSummary || (instance.state === 'CLOSED'
    ? {
        present: attendanceRecords.filter(r => r.status === 'PRESENT').length,
        absent: attendanceRecords.filter(r => r.status === 'ABSENT').length,
        excused: attendanceRecords.filter(r => r.status === 'EXCUSED').length,
      }
    : undefined);

  return {
    id: instance.id,
    templateId,
    subject,
    date: instance.date,
    time: instance.time,
    state: instance.state,
    startedAt: instance.startedAt ?? null,
    endedAt: instance.endedAt ?? null,
    studentCount: instance.studentCount ?? assignedStudents.length,
    assignedStudents,
    attendanceRecords,
    template: instance.template
      ? { id: instance.template.id, subject: instance.template.subject }
      : undefined,
    attendanceSummary: attendanceSummary ?? undefined,
  };
}

function mapBackendSessionTemplate(template: BackendSessionTemplate): SessionTemplate {
  return {
    id: template.id,
    subject: template.subject,
    daysOfWeek: template.daysOfWeek,
    time: template.time,
    assignedStudents: template.assignedStudents?.map(mapBackendStudent) ?? [],
  };
}

/**
 * Get today's session instances
 * @param date - Date in YYYY-MM-DD format (local timezone)
 */
export async function getTodayInstances(date: string): Promise<SessionInstance[]> {
  const response = await authClient.get<ApiSuccess<BackendSessionInstance[]> | BackendSessionInstance[]>(`/session-instances?date=${date}`);
  const instances = unwrapData<BackendSessionInstance[]>(response.data);
  return instances.map(mapBackendSessionInstance);
}

export async function getInstanceDetail(id: string): Promise<SessionInstanceDetail> {
  const response = await authClient.get<ApiSuccess<BackendSessionInstance> | BackendSessionInstance>(`/session-instances/${id}`);
  const instance = unwrapData<BackendSessionInstance>(response.data);
  return mapBackendSessionInstance(instance);
}

export async function startSession(id: string): Promise<SessionInstance> {
  const response = await authClient.post<ApiSuccess<BackendSessionInstance> | BackendSessionInstance>(`/session-instances/${id}/start`);
  const instance = unwrapData<BackendSessionInstance>(response.data);
  return mapBackendSessionInstance(instance);
}

export async function endSession(id: string): Promise<SessionInstance> {
  const response = await authClient.post<ApiSuccess<BackendSessionInstance> | BackendSessionInstance>(`/session-instances/${id}/end`);
  const instance = unwrapData<BackendSessionInstance>(response.data);
  return mapBackendSessionInstance(instance);
}

export async function createTemplate(
  data: Pick<CreateSessionInput, 'subject' | 'daysOfWeek' | 'time'>,
): Promise<SessionTemplate> {
  const payload = {
    subject: data.subject,
    daysOfWeek: data.daysOfWeek,
    time: data.time,
  };
  const response = await authClient.post<ApiSuccess<BackendSessionTemplate> | BackendSessionTemplate>('/session-templates', payload);
  const template = unwrapData<BackendSessionTemplate>(response.data);
  return mapBackendSessionTemplate(template);
}

export async function getTemplate(id: string): Promise<SessionTemplate> {
  const response = await authClient.get<ApiSuccess<BackendSessionTemplate> | BackendSessionTemplate>(`/session-templates/${id}`);
  const template = unwrapData<BackendSessionTemplate>(response.data);
  return mapBackendSessionTemplate(template);
}

export async function getTemplates(): Promise<SessionTemplate[]> {
  const response = await authClient.get<ApiSuccess<BackendSessionTemplate[]> | BackendSessionTemplate[]>('/session-templates');
  const templates = unwrapData<BackendSessionTemplate[]>(response.data);
  return templates.map(mapBackendSessionTemplate);
}

export async function updateTemplate(
  id: string,
  data: Pick<UpdateSessionInput, 'subject' | 'daysOfWeek' | 'time'>,
): Promise<SessionTemplate> {
  const payload = {
    subject: data.subject,
    daysOfWeek: data.daysOfWeek,
    time: data.time,
  };
  const response = await authClient.patch<ApiSuccess<BackendSessionTemplate> | BackendSessionTemplate>(`/session-templates/${id}`, payload);
  const template = unwrapData<BackendSessionTemplate>(response.data);
  return mapBackendSessionTemplate(template);
}

export async function deleteTemplate(id: string): Promise<void> {
  await authClient.delete(`/session-templates/${id}`);
}

export async function getAvailableStudents(templateId: string): Promise<Student[]> {
  const response = await authClient.get<ApiSuccess<BackendStudent[]> | BackendStudent[]>(`/session-templates/${templateId}/available-students`);
  const students = unwrapData<BackendStudent[]>(response.data);
  return students.map(mapBackendStudent);
}

export async function assignStudents(templateId: string, studentIds: string[]): Promise<void> {
  await authClient.post(`/session-templates/${templateId}/students`, { studentIds });
}

export async function removeStudents(templateId: string, studentIds: string[]): Promise<void> {
  await authClient.delete(`/session-templates/${templateId}/students`, { data: { studentIds } });
}
