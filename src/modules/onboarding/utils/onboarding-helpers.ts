import { isApiError } from '@/shared/services/api-utils';

/**
 * Decodes a JWT's `exp` claim (seconds since epoch). Returns null when the
 * token is malformed or `atob` is unavailable in the runtime.
 */
export function getJwtExpiry(accessToken: string): number | null {
  const parts = accessToken.split('.');
  if (parts.length < 2)
    return null;
  const base64Url = parts[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`;
  try {
    if (typeof globalThis.atob !== 'function')
      return null;
    const payload = JSON.parse(globalThis.atob(padded)) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp : null;
  }
  catch {
    return null;
  }
}

/**
 * Detects the "profile already exists" response (400/409 with a matching
 * message in EN or AR) so onboarding can treat it as idempotent success.
 */
export function isProfileAlreadyExistsError(error: unknown): boolean {
  if (!isApiError(error))
    return false;
  const status = error.response?.status;
  const data = error.response?.data as Record<string, unknown> | undefined;
  const normalize = (value: unknown): string => {
    if (typeof value === 'string')
      return value.toLowerCase();
    if (Array.isArray(value))
      return value.filter((item): item is string => typeof item === 'string').join(' ').toLowerCase();
    if (value && typeof value === 'object' && 'message' in (value as Record<string, unknown>))
      return normalize((value as Record<string, unknown>).message);
    return '';
  };
  const normalizedMessage = [
    normalize(data?.message),
    normalize(data?.error),
    normalize((error as { message?: unknown }).message),
  ].filter(Boolean).join(' ');
  return (status === 400 || status === 409)
    && (normalizedMessage.includes('profile already exists')
      || normalizedMessage.includes('الملف الشخصي موجود'));
}
