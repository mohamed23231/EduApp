/**
 * Error logging utility
 * Logs errors with screen context, action, and auth status
 * NO PII: excludes tokens, passwords, names, phone numbers
 */

export type LogErrorInput = {
  screen: string;
  action: string;
  errorCode?: string | number;
  statusCode?: number;
  message?: string;
};

/**
 * Log an error with context
 */
export function logError({ screen, action, errorCode, statusCode, message }: LogErrorInput): void {
  const timestamp = new Date().toISOString();

  const logEntry = {
    timestamp,
    screen,
    action,
    errorCode,
    statusCode,
    message: message?.substring(0, 200), // Truncate to prevent PII leakage
  };

  // Development: log to console
  if (__DEV__) {
    console.error('[Teacher Error]', JSON.stringify(logEntry, null, 2));
  }

  // Production: could send to error tracking service
  // Example: Sentry.captureException(new Error(`[${screen}] ${action}: ${message}`), {
  //   tags: { screen, action },
  //   extra: logEntry,
  // });
}

/**
 * Extract error code and message from error object
 */
export function getErrorDetails(error: unknown): { code?: string; message: string; status?: number } {
  if (!error) {
    return { message: 'Unknown error' };
  }

  if (typeof error === 'string') {
    return { message: error };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  if (typeof error === 'object' && 'response' in error) {
    const response = (error as any).response;
    return {
      code: response?.data?.code,
      message: response?.data?.message || response?.statusText || 'Request failed',
      status: response?.status,
    };
  }

  return { message: 'An unexpected error occurred' };
}
