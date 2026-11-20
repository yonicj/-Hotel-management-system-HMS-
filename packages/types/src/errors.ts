export const ErrorCode = {
  ROOM_UNAVAILABLE: 'ROOM_UNAVAILABLE',
  BALANCE_DUE: 'BALANCE_DUE',
  FORBIDDEN: 'FORBIDDEN',
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  BAD_REQUEST: 'BAD_REQUEST',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface ApiErrorPayload {
  code: ErrorCode | string;
  message: string;
  details: unknown;
}

export interface ApiErrorResponse {
  error: ApiErrorPayload;
}
