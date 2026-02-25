// Feature: auth-baseline-parent-mvp, Property 7: Error Display Precedence Chain
/**
 * Property 7: Error Display Precedence Chain
 *
 * For any error object passed to extractErrorMessage, the function SHALL return:
 * (1) the message field from the backend error envelope if present and non-empty,
 * (2) a localized offline error message if no HTTP response was received (network error)
 *     and no backend message is available,
 * (3) a generic localized fallback string for all other cases.
 * The function SHALL never return an empty string.
 *
 * This property test generates random error objects covering:
 * - AxiosError with message in response.data.message
 * - AxiosError without message (missing or empty)
 * - AxiosError with no response (network error)
 * - Non-Axios errors
 *
 * And verifies the precedence chain is followed correctly.
 *
 * Validates: Requirements 3.4, 9.5, 9.6, 13.1, 13.2, 13.5, 14.1, 14.5
 */

import type { AxiosError } from 'axios';
import type { ApiErrorEnvelope } from '@/shared/types/api';
import * as fc from 'fast-check';
import { extractErrorMessage } from '../error-utils';

// eslint-disable-next-line max-lines-per-function
describe('error-utils - Property 7: Error Display Precedence Chain', () => {
  let mockT: jest.Mock;

  beforeEach(() => {
    mockT = jest.fn((key: string) => key);
  });

  /**
   * Generator for non-empty, non-whitespace strings
   */
  const nonEmptyString = () =>
    fc
      .string({ minLength: 1 })
      .filter(s => s.trim().length > 0);

  /**
   * Generator for whitespace-only strings
   */
  const whitespaceOnlyString = () =>
    fc
      .array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1 })
      .map(chars => chars.join(''));

  /**
   * Generator for AxiosError with a backend message
   */
  const axiosErrorWithMessage = () =>
    nonEmptyString().map(message => ({
      isAxiosError: true,
      response: {
        data: {
          message,
        } as unknown as ApiErrorEnvelope,
      },
    } as AxiosError));

  /**
   * Generator for AxiosError without a backend message (missing or empty)
   */
  const axiosErrorWithoutMessage = () =>
    fc.oneof(
      // Missing message field
      fc.constant({
        isAxiosError: true,
        response: {
          data: {} as unknown as ApiErrorEnvelope,
        },
      } as AxiosError),
      // Empty string message
      fc.constant({
        isAxiosError: true,
        response: {
          data: {
            message: '',
          } as unknown as ApiErrorEnvelope,
        },
      } as AxiosError),
      // Whitespace-only message
      whitespaceOnlyString().map(ws => ({
        isAxiosError: true,
        response: {
          data: {
            message: ws,
          } as unknown as ApiErrorEnvelope,
        },
      } as AxiosError)),
      // null message
      fc.constant({
        isAxiosError: true,
        response: {
          data: {
            message: null,
          } as unknown as ApiErrorEnvelope,
        },
      } as AxiosError),
      // undefined message
      fc.constant({
        isAxiosError: true,
        response: {
          data: {
            message: undefined,
          } as unknown as ApiErrorEnvelope,
        },
      } as AxiosError),
    );

  /**
   * Generator for AxiosError with no response (network error)
   */
  const axiosErrorNetworkError = () =>
    fc.constant({
      isAxiosError: true,
      response: undefined,
    } as AxiosError);

  /**
   * Generator for non-Axios errors
   */
  const nonAxiosError = () =>
    fc.oneof(
      fc.constant(new Error('Generic error')),
      fc.constant(new TypeError('Type error')),
      fc.constant(new RangeError('Range error')),
      fc.constant(null),
      fc.constant(undefined),
      fc.constant({}),
      fc.constant({ message: 'Not an axios error' }),
    );

  /**
   * Main error generator combining all error types
   */
  const errorGenerator = () =>
    fc.oneof(
      axiosErrorWithMessage(),
      axiosErrorWithoutMessage(),
      axiosErrorNetworkError(),
      nonAxiosError(),
    );

  it('should follow the error display precedence chain for all error types', () => {
    fc.assert(
      fc.property(errorGenerator(), (error) => {
        const result = extractErrorMessage(error, mockT as any);

        // Property 1: Result should never be an empty string
        expect(result).not.toBe('');
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);

        // Property 2: Verify precedence chain
        if (
          error
          && typeof error === 'object'
          && 'isAxiosError' in error
          && error.isAxiosError === true
        ) {
          const axiosErr = error as AxiosError;

          // Step 1: Backend message present and non-empty
          const backendMessage = (axiosErr.response?.data as ApiErrorEnvelope)
            ?.message;
          if (
            backendMessage
            && typeof backendMessage === 'string'
            && backendMessage.trim().length > 0
          ) {
            // Should return the backend message verbatim
            expect(result).toBe(backendMessage);
          }
          else if (!axiosErr.response) {
            // Step 2: No response (network error)
            expect(result).toBe('parent.common.offlineError');
          }
          else {
            // Step 3: Generic fallback
            expect(result).toBe('parent.common.genericError');
          }
        }
        else {
          // Non-Axios error should return generic fallback
          expect(result).toBe('parent.common.genericError');
        }
      }),
      { numRuns: 100 },
    );
  });

  it('should prioritize backend message over all other cases', () => {
    fc.assert(
      fc.property(nonEmptyString(), (message) => {
        const error = {
          isAxiosError: true,
          response: {
            data: {
              message,
            } as unknown as ApiErrorEnvelope,
          },
        } as AxiosError;

        const result = extractErrorMessage(error, mockT as any);

        // Backend message should be returned verbatim
        expect(result).toBe(message);
        // Translation function should not be called
        expect(mockT).not.toHaveBeenCalled();
      }),
      { numRuns: 50 },
    );
  });

  it('should return offline error for network errors (no response)', () => {
    fc.assert(
      fc.property(fc.constant(undefined), () => {
        const error = {
          isAxiosError: true,
          response: undefined,
        } as AxiosError;

        const result = extractErrorMessage(error, mockT as any);

        expect(result).toBe('parent.common.offlineError');
        expect(mockT).toHaveBeenCalledWith('parent.common.offlineError');
      }),
      { numRuns: 10 },
    );
  });

  it('should return generic fallback for missing or empty backend messages', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(undefined),
          fc.constant(null),
          fc.constant(''),
          whitespaceOnlyString(),
        ),
        (messageValue) => {
          const error = {
            isAxiosError: true,
            response: {
              data: {
                message: messageValue,
              } as unknown as ApiErrorEnvelope,
            },
          } as AxiosError;

          const result = extractErrorMessage(error, mockT as any);

          expect(result).toBe('parent.common.genericError');
          expect(mockT).toHaveBeenCalledWith('parent.common.genericError');
        },
      ),
      { numRuns: 50 },
    );
  });

  it('should return generic fallback for non-Axios errors', () => {
    fc.assert(
      fc.property(nonAxiosError(), (error) => {
        const result = extractErrorMessage(error, mockT as any);

        expect(result).toBe('parent.common.genericError');
        expect(mockT).toHaveBeenCalledWith('parent.common.genericError');
      }),
      { numRuns: 30 },
    );
  });

  it('should never return an empty string regardless of input', () => {
    fc.assert(
      fc.property(errorGenerator(), (error) => {
        const result = extractErrorMessage(error, mockT as any);

        expect(result).not.toBe('');
        expect(result.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });

  it('should respect custom fallback key when provided', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(undefined),
          fc.constant(null),
          fc.constant(''),
        ),
        fc.string({ minLength: 5 }),
        (messageValue, customKey) => {
          const error = {
            isAxiosError: true,
            response: {
              data: {
                message: messageValue,
              } as unknown as ApiErrorEnvelope,
            },
          } as AxiosError;

          const result = extractErrorMessage(error, mockT as any, customKey);

          expect(result).toBe(customKey);
          expect(mockT).toHaveBeenCalledWith(customKey);
        },
      ),
      { numRuns: 30 },
    );
  });

  it('should handle backend messages with leading/trailing whitespace', () => {
    fc.assert(
      fc.property(
        nonEmptyString(),
        fc
          .array(fc.constantFrom(' ', '\t'), { maxLength: 5 })
          .map(chars => chars.join('')),
        (message, whitespace) => {
          const paddedMessage = `${whitespace}${message}${whitespace}`;
          const error = {
            isAxiosError: true,
            response: {
              data: {
                message: paddedMessage,
              } as unknown as ApiErrorEnvelope,
            },
          } as AxiosError;

          const result = extractErrorMessage(error, mockT as any);

          // Should return the message verbatim (with whitespace)
          expect(result).toBe(paddedMessage);
          expect(mockT).not.toHaveBeenCalled();
        },
      ),
      { numRuns: 30 },
    );
  });
});
