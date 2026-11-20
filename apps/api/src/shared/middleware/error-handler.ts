import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ErrorCode, ApiErrorResponse } from '@ehms/types';
import { AppError } from '../utils/app-error';

export function errorHandler(
  err: Error | unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // 1. Explicit AppError instances
  if (err instanceof AppError) {
    const response: ApiErrorResponse = {
      error: {
        code: err.code,
        message: err.message,
        details: err.details ?? null,
      },
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // 2. Direct Zod validation errors
  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    err.errors.forEach((e) => {
      const key = e.path.join('.') || 'root';
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(e.message);
    });

    const response: ApiErrorResponse = {
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
        details: fieldErrors,
      },
    };
    res.status(400).json(response);
    return;
  }

  const anyErr = err as any;
  const errMsg = typeof anyErr?.message === 'string' ? anyErr.message : '';
  const pgCode = anyErr?.meta?.code || anyErr?.code || '';

  // 3. PostgreSQL EXCLUDE constraint (23P01) - Room Overlap / Double-Booking
  if (
    pgCode === '23P01' ||
    errMsg.includes('23P01') ||
    errMsg.includes('no_overlapping_reservations') ||
    errMsg.includes('conflicting key value violates exclusion constraint')
  ) {
    const response: ApiErrorResponse = {
      error: {
        code: ErrorCode.ROOM_UNAVAILABLE,
        message: 'The selected room is unavailable for the requested dates.',
        details: anyErr?.meta ?? null,
      },
    };
    res.status(409).json(response);
    return;
  }

  // 4. Unique constraint violation (23505 or Prisma P2002)
  if (
    pgCode === '23505' ||
    anyErr?.code === 'P2002' ||
    errMsg.includes('23505') ||
    errMsg.includes('Unique constraint failed')
  ) {
    const target = Array.isArray(anyErr?.meta?.target)
      ? anyErr.meta.target.join(', ')
      : anyErr?.meta?.target || 'record';
    const response: ApiErrorResponse = {
      error: {
        code: ErrorCode.CONFLICT,
        message: `A record with this ${target} already exists.`,
        details: anyErr?.meta ?? null,
      },
    };
    res.status(409).json(response);
    return;
  }

  // 5. Check constraint violation (23514) - e.g. check_out_after_check_in
  if (
    pgCode === '23514' ||
    errMsg.includes('23514') ||
    errMsg.includes('check_out_after_check_in') ||
    errMsg.includes('violates check constraint')
  ) {
    const response: ApiErrorResponse = {
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Check constraint violation: provided dates or values are invalid.',
        details: anyErr?.meta ?? null,
      },
    };
    res.status(400).json(response);
    return;
  }

  // 6. Foreign key constraint violation (23503 or Prisma P2003)
  if (
    pgCode === '23503' ||
    anyErr?.code === 'P2003' ||
    errMsg.includes('Foreign key constraint violated')
  ) {
    const response: ApiErrorResponse = {
      error: {
        code: ErrorCode.CONFLICT,
        message: 'Related record does not exist or cannot be modified.',
        details: anyErr?.meta ?? null,
      },
    };
    res.status(409).json(response);
    return;
  }

  // 7. Prisma Record Not Found (P2025)
  if (anyErr?.code === 'P2025') {
    const response: ApiErrorResponse = {
      error: {
        code: ErrorCode.NOT_FOUND,
        message: anyErr?.meta?.cause || 'Requested record was not found.',
        details: anyErr?.meta ?? null,
      },
    };
    res.status(404).json(response);
    return;
  }

  // 8. PostgreSQL Trigger Exceptions (P0001 - Append-only / Financial deletion guard)
  if (
    errMsg.includes('audit_logs is append-only') ||
    errMsg.includes('Financial records cannot be deleted')
  ) {
    const response: ApiErrorResponse = {
      error: {
        code: ErrorCode.FORBIDDEN,
        message: errMsg.includes('audit_logs is append-only')
          ? 'audit_logs is append-only; updates and deletes are forbidden'
          : 'Financial records cannot be deleted. Use reversal or refund instead.',
        details: anyErr?.meta ?? null,
      },
    };
    res.status(403).json(response);
    return;
  }

  // 9. Unhandled fallback
  console.error('[Unhandled Server Error]', err);

  const fallbackResponse: ApiErrorResponse = {
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Internal server error',
      details: null,
    },
  };
  res.status(500).json(fallbackResponse);
}
