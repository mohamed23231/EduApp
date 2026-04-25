/**
 * Token management API service
 */

import type { UserRole } from '@/core/auth/roles';
import type { ApiSuccess } from '@/shared/types/api';
import { authClient } from '@/lib/api/client';

type RefreshTokenPayload = {
  accessToken: string;
  refreshToken: string;
};

type ValidateTokenUser = {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string;
  phoneE164?: string | null;
};

type ValidateTokenPayload = {
  user: ValidateTokenUser;
};

type ValidateTokenDirectPayload = {
  userId: string;
  email: string;
  role: UserRole;
  fullName?: string;
  phoneE164?: string | null;
  status?: string;
  profile?: unknown;
};

type OnboardingContextPayload = {
  email: string | null;
  role?: UserRole;
  fullName?: string;
  phoneE164?: string | null;
  onboardingReason: 'USER_NOT_FOUND' | 'PROFILE_NOT_FOUND';
};

export type RefreshTokenResponse = {
  accessToken: string;
  refreshToken: string;
};

export type ValidateTokenResponse = ValidateTokenUser;
export type OnboardingContextResponse = OnboardingContextPayload;

export async function refreshToken(currentRefreshToken: string): Promise<RefreshTokenResponse> {
  const response = await authClient.post<ApiSuccess<RefreshTokenPayload>>(
    '/auth/refresh',
    { refreshToken: currentRefreshToken },
  );
  return response.data.data;
}

export async function validateToken(): Promise<ValidateTokenResponse> {
  const response = await authClient.post<
        ApiSuccess<ValidateTokenPayload | ValidateTokenDirectPayload> | ValidateTokenPayload | ValidateTokenDirectPayload
  >(
    '/auth/validate-token',
  );
  const raw = response.data as Record<string, unknown>;
  const payload = ('success' in raw && 'data' in raw)
    ? (raw.data as Record<string, unknown>)
    : raw;

  // Shape A: { user: { id, email, role } }
  if (payload.user && typeof payload.user === 'object') {
    return payload.user as ValidateTokenUser;
  }

  // Shape B: { userId, email, role, ... } -> normalize to AuthUser shape
  if (
    typeof payload.userId === 'string'
    && typeof payload.email === 'string'
    && typeof payload.role === 'string'
  ) {
    return {
      id: payload.userId,
      email: payload.email,
      role: payload.role as UserRole,
      fullName: typeof payload.fullName === 'string' ? payload.fullName : undefined,
      phoneE164: payload.phoneE164 === null || typeof payload.phoneE164 === 'string'
        ? payload.phoneE164
        : undefined,
    };
  }

  throw new Error('Invalid validate-token response shape');
}

export async function getOnboardingContext(): Promise<OnboardingContextResponse> {
  const response = await authClient.post<ApiSuccess<OnboardingContextPayload>>(
    '/auth/onboarding-context',
  );
  return response.data.data;
}
