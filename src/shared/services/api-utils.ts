import type { AxiosError } from 'axios';
import axios from 'axios';
import type { ApiErrorEnvelope, ApiSuccess } from '@/shared/types/api';

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
 */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (!isApiError(error)) {
    return error instanceof Error ? error.message : fallback;
  }

  const data = error.response?.data;

  // Backend envelope format
  if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string' && data.message.trim().length > 0) {
    return data.message;
  }

  // No response = network error
  if (!error.response) {
    return 'Network error. Please check your connection.';
  }

  return fallback;
}
