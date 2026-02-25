import type { ApiSuccess } from '@/shared/types/api';
import { client } from '@/lib/api/client';
import { unwrapData } from '@/shared/services/api-utils';

type TeacherProfile = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'TEACHER';
};

type CreateTeacherProfileInput = {
  name: string;
  phone?: string;
};

export async function getTeacherProfile(): Promise<TeacherProfile> {
  const response = await client.get<ApiSuccess<TeacherProfile> | TeacherProfile>('/teachers/me');
  return unwrapData<TeacherProfile>(response.data);
}

export async function createTeacherProfile(data: CreateTeacherProfileInput): Promise<TeacherProfile> {
  const response = await client.post<ApiSuccess<TeacherProfile> | TeacherProfile>('/teachers/profile', data);
  return unwrapData<TeacherProfile>(response.data);
}
