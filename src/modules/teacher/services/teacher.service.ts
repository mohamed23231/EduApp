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

export type TeacherSubscriptionInfo = {
  id: string;
  status: 'INVITED' | 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  trial: {
    startDate: string;
    endDate: string;
    maxStudents: number;
    maxSessions: number;
    maxSessionHours: number;
    currentStudents: number;
    currentSessions: number;
    currentSessionHours: number;
  } | null;
  subscription: {
    status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
    startDate: string;
    endDate: string | null;
    plan: {
      id: string;
      name: string;
      maxStudents: number;
      maxSessionsPerMonth: number;
      maxSessionHoursPerMonth: number;
    } | null;
  } | null;
};

export async function getTeacherProfile(): Promise<TeacherProfile> {
  const response = await client.get<ApiSuccess<TeacherProfile> | TeacherProfile>('/teachers/me');
  return unwrapData<TeacherProfile>(response.data);
}

export async function getTeacherSubscriptionInfo(): Promise<TeacherSubscriptionInfo> {
  const response = await client.get<ApiSuccess<TeacherSubscriptionInfo> | TeacherSubscriptionInfo>('/teachers/me');
  return unwrapData<TeacherSubscriptionInfo>(response.data);
}

export async function createTeacherProfile(data: CreateTeacherProfileInput): Promise<TeacherProfile> {
  const response = await client.post<ApiSuccess<TeacherProfile> | TeacherProfile>('/teachers/profile', data);
  return unwrapData<TeacherProfile>(response.data);
}
