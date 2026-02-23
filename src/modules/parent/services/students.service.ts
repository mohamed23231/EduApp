import type { LinkStudentRequest, Student, StudentDetails } from '../types/student.types';
import type { ApiSuccess } from '@/shared/types/api';
import { client } from '@/lib/api/client';
import { unwrapData } from '@/shared/services/api-utils';

type BackendStudent = {
  id: string;
  name: string;
  gradeLevel?: string | null;
};

function mapBackendStudent(student: BackendStudent): Student {
  return {
    id: student.id,
    fullName: student.name,
    gradeLevel: student.gradeLevel ?? undefined,
  };
}

export async function fetchStudents(): Promise<Student[]> {
  const response = await client.get<ApiSuccess<BackendStudent[]> | BackendStudent[]>('/parents/students');
  const students = unwrapData<BackendStudent[]>(response.data);
  return students.map(mapBackendStudent);
}

export async function fetchStudentDetails(studentId: string): Promise<StudentDetails> {
  const students = await fetchStudents();
  const student = students.find(item => item.id === studentId);

  if (!student) {
    throw new Error('Student not found');
  }

  return {
    ...student,
    email: undefined,
    phone: undefined,
    enrollmentDate: undefined,
  };
}

export async function linkStudent(accessCode: string): Promise<Student> {
  const payload: LinkStudentRequest = { accessCode };
  const response = await client.post<ApiSuccess<BackendStudent> | BackendStudent>('/parents/link-student', payload);
  const student = unwrapData<BackendStudent>(response.data);
  return mapBackendStudent(student);
}
