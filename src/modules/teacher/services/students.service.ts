import type { AccessCode, CreateStudentInput, PaginatedStudents, Student, UpdateStudentInput } from '../types';
import type { ApiSuccess } from '@/shared/types/api';
import { authClient } from '@/lib/api/client';
import { unwrapData } from '@/shared/services/api-utils';

type BackendStudent = {
  id: string;
  name: string;
  gradeLevel?: string | null;
  notes?: string | null;
};

type BackendPaginatedStudents = {
  data: BackendStudent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
};

type BackendAccessCode = {
  id?: string;
  code: string;
  status?: 'active' | 'revoked';
  createdAt: string;
  revokedAt?: string | null;
};

function mapBackendStudent(student: BackendStudent): Student {
  return {
    id: student.id,
    name: student.name,
    gradeLevel: student.gradeLevel ?? undefined,
    notes: student.notes ?? undefined,
  };
}

function mapBackendPaginatedStudents(data: BackendPaginatedStudents): PaginatedStudents {
  const hasMore = data.pagination.page * data.pagination.limit < data.pagination.total;
  return {
    students: data.data.map(mapBackendStudent),
    pagination: {
      page: data.pagination.page,
      limit: data.pagination.limit,
      total: data.pagination.total,
      hasMore,
    },
  };
}

function mapBackendAccessCode(data: BackendAccessCode): AccessCode {
  return {
    id: data.id,
    code: data.code,
    status: data.status,
    createdAt: data.createdAt,
    revokedAt: data.revokedAt ?? undefined,
  };
}

export async function createStudent(data: CreateStudentInput): Promise<Student> {
  const response = await authClient.post<ApiSuccess<BackendStudent> | BackendStudent>('/students', data);
  const student = unwrapData<BackendStudent>(response.data);
  return mapBackendStudent(student);
}

export async function getStudents(params: { page: number; limit: number; search?: string }): Promise<PaginatedStudents> {
  const queryParams = new URLSearchParams({
    page: params.page.toString(),
    limit: params.limit.toString(),
  });
  if (params.search) {
    queryParams.append('search', params.search);
  }
  const response = await authClient.get<ApiSuccess<BackendPaginatedStudents> | BackendPaginatedStudents>(`/students?${queryParams.toString()}`);
  const data = unwrapData<BackendPaginatedStudents>(response.data);
  return mapBackendPaginatedStudents(data);
}

export async function getStudent(id: string): Promise<Student> {
  const response = await authClient.get<ApiSuccess<BackendStudent> | BackendStudent>(`/students/${id}`);
  const student = unwrapData<BackendStudent>(response.data);
  return mapBackendStudent(student);
}

export async function updateStudent(id: string, data: UpdateStudentInput): Promise<Student> {
  const response = await authClient.patch<ApiSuccess<BackendStudent> | BackendStudent>(`/students/${id}`, data);
  const student = unwrapData<BackendStudent>(response.data);
  return mapBackendStudent(student);
}

export async function deleteStudent(id: string): Promise<void> {
  await authClient.delete(`/students/${id}`);
}

export async function getAccessCode(studentId: string): Promise<AccessCode> {
  const response = await authClient.get<ApiSuccess<BackendAccessCode> | BackendAccessCode>(`/students/${studentId}/access-code`);
  const data = unwrapData<BackendAccessCode>(response.data);
  return mapBackendAccessCode(data);
}

export async function regenerateAccessCode(studentId: string): Promise<AccessCode> {
  const response = await authClient.post<ApiSuccess<BackendAccessCode> | BackendAccessCode>(`/students/${studentId}/access-code/regenerate`);
  const data = unwrapData<BackendAccessCode>(response.data);
  return mapBackendAccessCode(data);
}
