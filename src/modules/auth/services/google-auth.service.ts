import type {
  CompletePasswordResetPayload,
  CompletePasswordResetResponse,
  ForgotPasswordResponse,
  GoogleLoginResponse,
  GoogleSignupResponse,
} from '../types/google-auth.types';
import { authClient } from '@/lib/api/client';

/**
 * Google Auth Service
 *
 * Handles Google authentication API calls for login, signup, and password reset.
 * Supports the two-step login→signup flow with AUTH_SIGNUP_REQUIRED handling.
 *
 * Requirements: 10.3, 10.4, 10.8
 */
export const googleAuthService = {
  /**
   * Google Login
   *
   * Attempts to log in with a Google ID token.
   * Returns AUTH_SIGNUP_REQUIRED if no DB user exists.
   *
   * @param idToken - Google ID token from Google Sign-In
   * @returns Login response or AUTH_SIGNUP_REQUIRED error envelope
   */
  async googleLogin(idToken: string): Promise<GoogleLoginResponse> {
    const response = await authClient.post<GoogleLoginResponse>(
      '/auth/google/login',
      { idToken },
    );
    return response.data;
  },

  /**
   * Google Signup
   *
   * Creates a new account or signs in existing user with Google. The token
   * reuse window (Requirement 10.7) is owned by the screen layer via
   * `@/lib/auth/token-reuse-window`, which gates re-use before this is called.
   *
   * @param idToken - Google ID token from Google Sign-In
   * @param role - User role (TEACHER, PARENT, or MANAGER)
   * @returns Signup response with tokens and user info
   */
  async googleSignup(
    idToken: string,
    role: 'TEACHER' | 'PARENT' | 'MANAGER',
  ): Promise<GoogleSignupResponse> {
    const response = await authClient.post<GoogleSignupResponse>(
      '/auth/google/signup',
      { idToken, role },
    );
    return response.data;
  },

  /**
   * Forgot Password
   *
   * Requests a password reset email.
   * Returns generic success for all scenarios (enumeration-safe).
   *
   * @param email - User's email address
   * @returns Generic success response
   */
  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const response = await authClient.post<ForgotPasswordResponse>(
      '/auth/forgot-password',
      { email },
    );
    return response.data;
  },

  /**
   * Complete Password Reset
   *
   * Sends token data and new password to backend.
   * Backend handles all Supabase interaction — frontend never calls Supabase directly.
   *
   * @param payload - Either { code, newPassword } or { accessToken, refreshToken, newPassword }
   * @returns Success response
   */
  async completePasswordReset(
    payload: CompletePasswordResetPayload,
  ): Promise<CompletePasswordResetResponse> {
    const response = await authClient.post<CompletePasswordResetResponse>(
      '/auth/reset-password/complete',
      payload,
    );
    return response.data;
  },
};
