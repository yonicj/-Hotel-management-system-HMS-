import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: (err as any).errors,
      statusCode: err.statusCode,
    });
    return;
  }

  // Log unexpected errors
  console.error('[Unhandled Error]', err);

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    statusCode: 500,
  });
}
