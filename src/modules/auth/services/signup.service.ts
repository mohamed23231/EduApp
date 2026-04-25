/**
 * Signup API service
 */

import type { SignupPayload } from '../types/signup.types';
import type { ApiSuccess } from '@/shared/types/api';
import { authClient } from '@/lib/api/client';

type SignupApiPayload = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    fullName?: string;
  };
};

export type SignupResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    fullName?: string;
  };
};

export async function signupService(data: SignupPayload): Promise<SignupResponse> {
  const response = await authClient.post<ApiSuccess<SignupApiPayload>>('/auth/signup', data);
  return response.data.data;
}
