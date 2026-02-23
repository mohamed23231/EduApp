import type { AccessCode, CreateStudentInput, PaginatedStudents, Student, UpdateStudentInput } from '../types';
import type { ApiSuccess } from '@/shared/types/api';
import { client } from '@/lib/api/client';
import { unwrapData } from '@/shared/services/api-utils';

type BackendStudent = {
  id: string;
  name: string;
  gradeLevel?: string | null;
  notes?: string | null;
};

type BackendPaginatedStudents = {
  students: BackendStudent[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

type BackendAccessCode = {
  code: string;
  createdAt: string;
  expiresAt?: string | null;
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
  return {
    students: data.students.map(mapBackendStudent),
    pagination: {
      page: data.page,
      limit: data.limit,
      total: data.total,
      hasMore: data.hasMore,
    },
  };
}

function mapBackendAccessCode(data: BackendAccessCode): AccessCode {
  return {
    code: data.code,
    createdAt: data.createdAt,
    expiresAt: data.expiresAt ?? undefined,
  };
}

export async function createStudent(data: CreateStudentInput): Promise<Student> {
  const response = await client.post<ApiSuccess<BackendStudent> | BackendStudent>('/api/students', data);
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
  const response = await client.get<ApiSuccess<BackendPaginatedStudents> | BackendPaginatedStudents>(`/api/students?${queryParams.toString()}`);
  const data = unwrapData<BackendPaginatedStudents>(response.data);
  return mapBackendPaginatedStudents(data);
}

export async function getStudent(id: string): Promise<Student> {
  const response = await client.get<ApiSuccess<BackendStudent> | BackendStudent>(`/api/students/${id}`);
  const student = unwrapData<BackendStudent>(response.data);
  return mapBackendStudent(student);
}

export async function updateStudent(id: string, data: UpdateStudentInput): Promise<Student> {
  const response = await client.patch<ApiSuccess<BackendStudent> | BackendStudent>(`/api/students/${id}`, data);
  const student = unwrapData<BackendStudent>(response.data);
  return mapBackendStudent(student);
}

export async function deleteStudent(id: string): Promise<void> {
  await client.delete(`/api/students/${id}`);
}

export async function getAccessCode(studentId: string): Promise<AccessCode> {
  const response = await client.get<ApiSuccess<BackendAccessCode> | BackendAccessCode>(`/api/students/${studentId}/access-code`);
  const data = unwrapData<BackendAccessCode>(response.data);
  return mapBackendAccessCode(data);
}

export async function regenerateAccessCode(studentId: string): Promise<AccessCode> {
  const response = await client.post<ApiSuccess<BackendAccessCode> | BackendAccessCode>(`/api/students/${studentId}/access-code/regenerate`);
  const data = unwrapData<BackendAccessCode>(response.data);
  return mapBackendAccessCode(data);
}
