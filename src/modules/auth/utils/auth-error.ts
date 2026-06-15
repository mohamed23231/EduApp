import type { AxiosError } from 'axios';
import type { ApiErrorEnvelope } from '@/shared/types/api';
import axios from 'axios';

/**
 * Auth error matrix (002-ui-redesign, locked 2026-06-15).
 *
 * The login enumeration-merge ruling: "account-not-found" and "wrong-password"
 * MUST collapse to a single generic credential error (OWASP A07 — never reveal
 * whether an account exists). Rate-limited and network failures stay distinct so
 * the user knows whether to wait or check their connection. Anything else falls
 * back to a generic auth error.
 *
 * This classifier maps a thrown error to a stable kind + i18n key. Screens
 * translate the key and surface it via `useToast({ kind: 'error' })`.
 */

export type AuthErrorKind
  = | 'credential' // account-not-found OR wrong-password (merged)
    | 'rateLimited' // too many attempts
    | 'network' // request never reached the server
    | 'generic'; // anything else

export type AuthErrorContext = 'login' | 'signup' | 'reset';

export type ClassifiedAuthError = {
  kind: AuthErrorKind;
  /** i18n key resolving to the user-facing message for this kind. */
  messageKey: string;
  /** English fallback to pass as the second arg to `t()`. */
  fallback: string;
};

function isApiError(error: unknown): error is AxiosError<ApiErrorEnvelope> {
  return axios.isAxiosError(error);
}

function statusOf(error: AxiosError<ApiErrorEnvelope>): number | undefined {
  return error.response?.status ?? error.response?.data?.statusCode;
}

/** Backend codes that unambiguously mean "bad credentials" — always merged. */
const CREDENTIAL_CODES = new Set([
  'AUTH_INVALID_CREDENTIALS',
  'AUTH_USER_NOT_FOUND',
  'AUTH_WRONG_PASSWORD',
  'AUTH_ACCOUNT_NOT_FOUND',
]);

const CONTEXT_GENERIC_FALLBACK: Record<AuthErrorContext, string> = {
  login: 'Failed to sign in. Please try again.',
  signup: 'Something went wrong. Please try again.',
  reset: 'Unable to reset password. Please try again.',
};

const CONTEXT_GENERIC_KEY: Record<AuthErrorContext, string> = {
  login: 'auth.login.genericError',
  signup: 'auth.signup.genericError',
  reset: 'auth.reset_password.error',
};

function credentialError(): ClassifiedAuthError {
  return {
    kind: 'credential',
    messageKey: 'auth.errors.invalidCredentials',
    fallback: 'Incorrect phone/email or password. Please try again.',
  };
}

function rateLimitedError(): ClassifiedAuthError {
  return {
    kind: 'rateLimited',
    messageKey: 'auth.errors.rateLimited',
    fallback: 'Too many attempts. Please wait a moment and try again.',
  };
}

function networkError(): ClassifiedAuthError {
  return {
    kind: 'network',
    messageKey: 'auth.errors.network',
    fallback: 'Network error. Please check your connection and try again.',
  };
}

function genericError(context: AuthErrorContext): ClassifiedAuthError {
  return {
    kind: 'generic',
    messageKey: CONTEXT_GENERIC_KEY[context],
    fallback: CONTEXT_GENERIC_FALLBACK[context],
  };
}

/**
 * Classify a thrown auth error against the locked matrix.
 *
 * For `login`, 401/403 with a credential-shaped code (or no specific code) is
 * always reported as the merged generic credential error — we deliberately do
 * NOT pass the backend's raw "user not found" / "wrong password" message
 * through, to avoid account enumeration.
 */
export function classifyAuthError(
  error: unknown,
  context: AuthErrorContext,
): ClassifiedAuthError {
  if (!isApiError(error)) {
    return genericError(context);
  }

  if (!error.response) {
    return networkError();
  }

  const status = statusOf(error);
  const code = error.response.data?.code;

  if (status === 429) {
    return rateLimitedError();
  }

  if (context === 'login' && (status === 401 || status === 403)) {
    return credentialError();
  }

  if (code && CREDENTIAL_CODES.has(code)) {
    return credentialError();
  }

  return genericError(context);
}
