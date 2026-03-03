import type { AxiosError } from 'axios';
import type { ApiErrorEnvelope, ApiSuccess } from '@/shared/types/api';
import axios from 'axios';

/**
 * Normalizes API responses by extracting data from both raw and envelope formats.
 * If the payload has `success` + `data` keys → extracts `.data` as T
 * Otherwise → treats the entire payload as raw T
 * Validates: Requirement 10.3
 */
export function unwrapData<T>(payload: ApiSuccess<T> | T): T {
  if (
    payload
    && typeof payload === 'object'
    && 'success' in (payload as Record<string, unknown>)
    && 'data' in (payload as Record<string, unknown>)
  ) {
    return (payload as ApiSuccess<T>).data;
  }
  return payload as T;
}

/**
 * Type-safe axios error check.
 * Use this instead of importing axios in screens/components.
 */
export function isApiError(error: unknown): error is AxiosError<ApiErrorEnvelope> {
  return axios.isAxiosError(error);
}

/**
 * Extract a user-friendly error message from an API error.
 * Falls back to the provided default message.
 *
 * @param codeTranslator - Optional function to translate `AUTH_*` error codes.
 *   Pass `(code) => t(\`auth.errors.${code}\`, { defaultValue: '' })` at call sites.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong',
  codeTranslator?: (code: string) => string,
): string {
  if (!isApiError(error)) {
    return error instanceof Error ? error.message : fallback;
  }

  const data = error.response?.data;

  if (data && typeof data === 'object') {
    // Translate known backend error codes (AUTH_* codes → i18n keys)
    if (codeTranslator && 'code' in data && typeof (data as Record<string, unknown>).code === 'string') {
      const translated = codeTranslator((data as Record<string, unknown>).code as string);
      if (translated && translated.trim().length > 0) {
        return translated;
      }
    }

    // Backend envelope format: use message field
    if ('message' in data && typeof (data as Record<string, unknown>).message === 'string') {
      const msg = ((data as Record<string, unknown>).message as string).trim();
      if (msg.length > 0) {
        return msg;
      }
    }
  }

  // No response = network error
  if (!error.response) {
    return 'Network error. Please check your connection.';
  }

  return fallback;
}
