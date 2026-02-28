import type { UserRole } from '@/core/auth/roles';

/**
 * Google Auth Response Types
 *
 * Handles the special case where HTTP 200 can contain success: false
 * for AUTH_SIGNUP_REQUIRED flow signal.
 */

export type GoogleAuthUser = {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string;
};

/**
 * Successful Google login response
 */
export type GoogleLoginResponseSuccess = {
  success: true;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    user: GoogleAuthUser;
    profile?: Record<string, unknown>;
    onboardingRequired: boolean;
  };
};

/**
 * AUTH_SIGNUP_REQUIRED response (HTTP 200 with success: false)
 * This is not an error - it's a flow signal indicating the user needs to complete signup
 */
export type GoogleLoginResponseSignupRequired = {
  success: false;
  code: 'AUTH_SIGNUP_REQUIRED';
  statusCode: 200;
  message: string;
  data: {
    prefillEmail: string;
  };
};

export type GoogleLoginResponse
  = GoogleLoginResponseSuccess
    | GoogleLoginResponseSignupRequired;

/**
 * Successful Google signup response
 */
export type GoogleSignupResponse = {
  success: true;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    user: GoogleAuthUser & { fullName: string };
    profile?: Record<string, unknown>;
    onboardingRequired: boolean;
  };
};

/**
 * Forgot password response (always success)
 */
export type ForgotPasswordResponse = {
  success: true;
  message: string;
};

/**
 * Complete password reset payload
 * Either code flow or fragment flow (code takes precedence)
 */
export type CompletePasswordResetPayload
  = { code: string; newPassword: string }
    | { accessToken: string; refreshToken: string; newPassword: string };

/**
 * Complete password reset response
 */
export type CompletePasswordResetResponse = {
  success: true;
  message: string;
};
