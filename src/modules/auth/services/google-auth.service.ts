import type {
  CompletePasswordResetPayload,
  CompletePasswordResetResponse,
  ForgotPasswordResponse,
  GoogleLoginResponse,
  GoogleSignupResponse,
} from '../types/google-auth.types';
import { authClient } from '@/lib/api/client';

/** Token reuse window: 120 seconds (Requirement 10.7) */
const TOKEN_REUSE_WINDOW_MS = 120 * 1000;

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
   * Creates a new account or signs in existing user with Google.
   * Enforces token reuse window: if iat is provided and token is older than
   * 120 seconds, caller must re-acquire a fresh token before calling this.
   *
   * @param idToken - Google ID token from Google Sign-In
   * @param role - User role (TEACHER or PARENT)
   * @param iat - Optional timestamp (ms) when the token was obtained
   * @returns Signup response with tokens and user info
   * @throws Error if token is expired (older than TOKEN_REUSE_WINDOW_MS)
   */
  async googleSignup(
    idToken: string,
    role: 'TEACHER' | 'PARENT',
    iat?: number,
  ): Promise<GoogleSignupResponse> {
    // Enforce token reuse window (Requirement 10.7)
    if (iat !== undefined && (Date.now() - iat) > TOKEN_REUSE_WINDOW_MS) {
      throw new Error('TOKEN_REUSE_WINDOW_EXPIRED');
    }
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

  /**
   * Check if a Google ID token is within the reuse window.
   *
   * @param iat - Timestamp (ms) when the token was obtained
   * @returns true if token is still valid for reuse, false if expired
   */
  isTokenFresh(iat: number): boolean {
    return (Date.now() - iat) <= TOKEN_REUSE_WINDOW_MS;
  },
};
