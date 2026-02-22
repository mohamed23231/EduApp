/**
 * Auth Contract Snapshot Types
 *
 * This file documents the frozen request and response shapes for the four auth endpoints.
 * These types serve as the stable contract baseline for frontend development.
 *
 * Endpoints:
 * - POST /api/auth/login
 * - POST /api/auth/signup
 * - POST /api/auth/refresh
 * - POST /api/auth/validate-token
 *
 * All endpoints return responses wrapped in the standard envelope format.
 * Error responses use the ErrorEnvelope type.
 *
 * Requirements: 3.1, 3.2
 */

/**
 * POST /api/auth/login request
 */
export type LoginRequest = {
  email: string;
  password: string;
};

/**
 * POST /api/auth/login success response data
 */
export type LoginSuccessData = {
  accessToken: string;
  refreshToken: string;
  user?: {
    id: string;
    email: string;
    role: string;
    fullName?: string;
  };
  onboardingRequired?: boolean;
  onboardingReason?: 'USER_NOT_FOUND' | 'PROFILE_NOT_FOUND';
};

/**
 * POST /api/auth/signup request
 */
export type SignupRequest = {
  email: string;
  password: string;
  fullName: string;
  role: 'TEACHER' | 'PARENT';
};

/**
 * POST /api/auth/signup success response data
 */
export type SignupSuccessData = {
  accessToken: string;
  refreshToken: string;
  user?: {
    id: string;
    email: string;
    role: string;
    fullName?: string;
  };
  onboardingRequired: boolean;
  onboardingReason?: 'USER_NOT_FOUND' | 'PROFILE_NOT_FOUND';
};

/**
 * POST /api/auth/refresh request
 */
export type RefreshRequest = {
  refreshToken: string;
};

/**
 * POST /api/auth/refresh success response data
 */
export type RefreshSuccessData = {
  accessToken: string;
  refreshToken: string;
};

/**
 * POST /api/auth/validate-token success response data
 */
export type ValidateTokenSuccessData = {
  user: {
    id: string;
    email: string;
    role: string;
    fullName?: string;
  };
};

/**
 * Standard error envelope returned by all endpoints on failure
 */
export type ErrorEnvelope = {
  success: false;
  message: string;
  data: null;
  code: string;
  statusCode: number;
};
