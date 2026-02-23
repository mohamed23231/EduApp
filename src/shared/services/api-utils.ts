import type { ApiSuccess } from '@/shared/types/api';

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
