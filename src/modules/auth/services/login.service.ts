import type { LoginRequestParams, LoginResponse, LoginUser } from '../types';
import type { ApiSuccess } from '@/shared/types/api';
import { authClient } from '@/lib/api/client';

type LoginApiPayload = {
  accessToken: string;
  refreshToken: string;
  user?: LoginUser;
  onboardingRequired?: boolean;
};

export async function loginService(data: LoginRequestParams): Promise<LoginResponse> {
  const response = await authClient.post<ApiSuccess<LoginApiPayload>>('/auth/login', data);
  const payload = response.data.data;
  const onboardingRequired = payload.onboardingRequired ?? false;

  if (onboardingRequired) {
    return {
      access: payload.accessToken,
      refresh: payload.refreshToken,
      user: null,
      onboardingRequired: true,
    };
  }

  if (!payload.user) {
    throw new Error('Missing user payload in login response');
  }

  return {
    access: payload.accessToken,
    refresh: payload.refreshToken,
    user: payload.user,
    onboardingRequired: false,
  };
}
