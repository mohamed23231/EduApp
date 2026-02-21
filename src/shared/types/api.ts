export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type ApiErrorEnvelope = {
  success: false;
  statusCode: number;
  error: string;
  code?: string;
  message: string;
  data: null;
  timestamp: string;
  path: string;
  details?: unknown;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorEnvelope;
