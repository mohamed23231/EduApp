import type { AxiosError } from 'axios';

import type { ApiErrorEnvelope } from '@/shared/types/api';

import { extractErrorMessage, isAxiosError } from '../error-utils';

// eslint-disable-next-line max-lines-per-function
describe('error-utils', () => {
  let mockT: jest.Mock;

  beforeEach(() => {
    mockT = jest.fn((key: string) => key);
  });

  describe('isAxiosError', () => {
    it('should return true for Axios errors', () => {
      const error = {
        isAxiosError: true,
        message: 'Network error',
      } as AxiosError;

      expect(isAxiosError(error)).toBe(true);
    });

    it('should return false for non-Axios errors', () => {
      const error = new Error('Generic error');
      expect(isAxiosError(error)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isAxiosError(null)).toBe(false);
      expect(isAxiosError(undefined)).toBe(false);
    });

    it('should return false for plain objects without isAxiosError flag', () => {
      expect(isAxiosError({})).toBe(false);
      expect(isAxiosError({ message: 'error' })).toBe(false);
    });
  });

  // eslint-disable-next-line max-lines-per-function
  describe('extractErrorMessage', () => {
    it('should return backend message when present and non-empty', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: {
            message: 'Invalid access code',
          } as unknown as ApiErrorEnvelope,
        },
      } as AxiosError;

      const result = extractErrorMessage(error, mockT as any);
      expect(result).toBe('Invalid access code');
      expect(mockT).not.toHaveBeenCalled();
    });

    it('should return offline error when no response received', () => {
      const error = {
        isAxiosError: true,
        response: undefined,
      } as AxiosError;

      const result = extractErrorMessage(error, mockT as any);
      expect(result).toBe('parent.common.offlineError');
      expect(mockT).toHaveBeenCalledWith('parent.common.offlineError');
    });

    it('should return generic fallback when backend message is missing', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: {
            message: undefined,
          } as unknown as ApiErrorEnvelope,
        },
      } as AxiosError;

      const result = extractErrorMessage(error, mockT as any);
      expect(result).toBe('parent.common.genericError');
      expect(mockT).toHaveBeenCalledWith('parent.common.genericError');
    });

    it('should return generic fallback when backend message is empty string', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: {
            message: '',
          } as unknown as ApiErrorEnvelope,
        },
      } as AxiosError;

      const result = extractErrorMessage(error, mockT as any);
      expect(result).toBe('parent.common.genericError');
    });

    it('should return generic fallback when backend message is whitespace only', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: {
            message: '   ',
          } as unknown as ApiErrorEnvelope,
        },
      } as AxiosError;

      const result = extractErrorMessage(error, mockT as any);
      expect(result).toBe('parent.common.genericError');
    });

    it('should return generic fallback for non-Axios errors', () => {
      const error = new Error('Generic error');

      const result = extractErrorMessage(error, mockT as any);
      expect(result).toBe('parent.common.genericError');
      expect(mockT).toHaveBeenCalledWith('parent.common.genericError');
    });

    it('should use custom fallback key when provided', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: {
            message: '',
          } as unknown as ApiErrorEnvelope,
        },
      } as AxiosError;

      const result = extractErrorMessage(error, mockT as any, 'custom.error.key');
      expect(result).toBe('custom.error.key');
      expect(mockT).toHaveBeenCalledWith('custom.error.key');
    });

    it('should return generic fallback when response data is not in expected format', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: null,
        },
      } as AxiosError;

      const result = extractErrorMessage(error, mockT as any);
      expect(result).toBe('parent.common.genericError');
    });

    it('should prioritize backend message over offline error', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: {
            message: 'Student already linked',
          } as unknown as ApiErrorEnvelope,
        },
      } as AxiosError;

      const result = extractErrorMessage(error, mockT as any);
      expect(result).toBe('Student already linked');
      expect(mockT).not.toHaveBeenCalled();
    });

    it('should handle backend message with leading/trailing whitespace', () => {
      const error = {
        isAxiosError: true,
        response: {
          data: {
            message: '  Valid message  ',
          } as unknown as ApiErrorEnvelope,
        },
      } as AxiosError;

      const result = extractErrorMessage(error, mockT as any);
      expect(result).toBe('  Valid message  ');
      expect(mockT).not.toHaveBeenCalled();
    });
  });
});
