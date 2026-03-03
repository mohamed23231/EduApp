import type {
  ParentInviteAcceptParams,
  ParentInviteValidateResponse,
  PhoneAuthResponse,
  PhoneLoginParams,
  PhoneLoginResponseUnion,
  PhoneOtpRequestParams,
  PhoneSignupVerifyParams,
  PhoneSignupVerifyResponse,
  PhoneResetPasswordConfirmParams,
  PhoneResetPasswordRequestParams,
  PhoneSignupParams,
} from '../types';
import type { ApiSuccess } from '@/shared/types/api';
import { authClient } from '@/lib/api/client';

function normalizePhoneAuthResponse(payload: PhoneAuthResponse): PhoneAuthResponse {
  if (payload.user) {
    return payload;
  }

  if (payload.userId && payload.role) {
    return {
      ...payload,
      user: {
        id: payload.userId,
        email: payload.email ?? null,
        role: payload.role,
        ...(payload.fullName ? { fullName: payload.fullName } : {}),
        ...(payload.phoneE164 !== undefined ? { phoneE164: payload.phoneE164 } : {}),
      },
    };
  }

  return payload;
}

/**
 * Request OTP for phone signup or password reset
 * Always returns 200 for security (enumeration-safe)
 */
export async function requestPhoneOtp(data: PhoneOtpRequestParams): Promise<void> {
  await authClient.post('/auth/phone/otp/request', data);
}

/**
 * Sign up with phone and OTP
 */
export async function phoneSignup(data: PhoneSignupParams): Promise<PhoneAuthResponse> {
  const response = await authClient.post<ApiSuccess<PhoneAuthResponse>>('/auth/phone/signup', data);
  return normalizePhoneAuthResponse(response.data.data);
}

/**
 * Verify signup OTP step and check whether signup can continue.
 */
export async function verifyPhoneSignup(
  data: PhoneSignupVerifyParams,
): Promise<PhoneSignupVerifyResponse> {
  const response = await authClient.post<ApiSuccess<PhoneSignupVerifyResponse>>(
    '/auth/phone/signup/verify',
    data,
  );
  return response.data.data;
}

/**
 * Login with phone and password
 */
export async function phoneLogin(data: PhoneLoginParams): Promise<PhoneLoginResponseUnion> {
  const response = await authClient.post<ApiSuccess<PhoneAuthResponse>>('/auth/phone/login', data);
  const payload = normalizePhoneAuthResponse(response.data.data);
  const onboardingRequired = payload.onboardingRequired ?? false;

  if (onboardingRequired) {
    return {
      access: payload.accessToken,
      refresh: payload.refreshToken,
      user: payload.user ?? null,
      onboardingRequired: true,
      onboardingReason: payload.onboardingReason,
    };
  }

  if (!payload.user) {
    throw new Error('Missing user payload in phone login response');
  }

  return {
    access: payload.accessToken,
    refresh: payload.refreshToken,
    user: payload.user,
    onboardingRequired: false,
  };
}

/**
 * Request password reset OTP via WhatsApp
 * Always returns 200 for security (enumeration-safe)
 */
export async function requestPhoneResetPassword(data: PhoneResetPasswordRequestParams): Promise<void> {
  await authClient.post('/auth/phone/reset-password/request', data);
}

/**
 * Confirm password reset with OTP
 */
export async function confirmPhoneResetPassword(data: PhoneResetPasswordConfirmParams): Promise<void> {
  await authClient.post('/auth/phone/reset-password/confirm', data);
}

/**
 * Validate parent invite token
 */
export async function validateParentInvite(token: string): Promise<ParentInviteValidateResponse> {
  const response = await authClient.get<ApiSuccess<ParentInviteValidateResponse>>(
    `/auth/parent-invite/validate?token=${encodeURIComponent(token)}`,
  );
  return response.data.data;
}

/**
 * Accept parent invite and set password
 */
export async function acceptParentInvite(data: ParentInviteAcceptParams): Promise<PhoneAuthResponse> {
  const response = await authClient.post<ApiSuccess<PhoneAuthResponse>>('/auth/parent-invite/accept', data);
  return normalizePhoneAuthResponse(response.data.data);
}
