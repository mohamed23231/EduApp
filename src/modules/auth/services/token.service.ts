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

/**
 * Wire shape of `POST /auth/validate-token`'s `data` payload, as built inline by
 * the backend controller (tutoring-backend `auth.controller.ts` validateToken,
 * ~L195-209). The field is the flat `userId` — NOT a `{ user: {...} }` wrapper.
 * `status` / `profile` are sometimes present but unused by the mobile client.
 */
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
        ApiSuccess<ValidateTokenDirectPayload> | ValidateTokenDirectPayload
  >(
    '/auth/validate-token',
  );
  const raw = response.data as Record<string, unknown>;
  const payload = ('success' in raw && 'data' in raw)
    ? (raw.data as Record<string, unknown>)
    : raw;

  // The backend returns a single, flat shape: { userId, email, role, ... }
  // (tutoring-backend auth.controller.ts validateToken). Parse defensively and
  // normalize to the AuthUser shape callers depend on ({ id, email, role, ... }).
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
