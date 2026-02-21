export const ErrorCode = {
  parentAccessCodeInvalid: 'PARENT_ACCESS_CODE_INVALID',
  parentAccessCodeRevoked: 'PARENT_ACCESS_CODE_REVOKED',
  parentProfileNotFound: 'PARENT_PROFILE_NOT_FOUND',
  parentStudentAccessForbidden: 'PARENT_STUDENT_ACCESS_FORBIDDEN',
  validationError: 'VALIDATION_ERROR',
  internalServerError: 'INTERNAL_SERVER_ERROR',
  rateLimitExceeded: 'RATE_LIMIT_EXCEEDED',
} as const;

export type ApiErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
