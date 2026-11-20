import { ErrorCode } from '@ehms/types';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode | string;
  public readonly details: unknown;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: ErrorCode | string,
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || AppError.defaultCodeForStatus(statusCode);
    this.details = details !== undefined ? details : null;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  private static defaultCodeForStatus(status: number): ErrorCode | string {
    switch (status) {
      case 400:
        return ErrorCode.BAD_REQUEST;
      case 401:
        return ErrorCode.UNAUTHORIZED;
      case 403:
        return ErrorCode.FORBIDDEN;
      case 404:
        return ErrorCode.NOT_FOUND;
      case 409:
        return ErrorCode.CONFLICT;
      case 422:
        return ErrorCode.VALIDATION_ERROR;
      default:
        return ErrorCode.INTERNAL_ERROR;
    }
  }
}
