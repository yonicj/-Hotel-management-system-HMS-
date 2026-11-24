import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { ZodError, z } from 'zod';
import { ErrorCode } from '@ehms/types';
import { AppError } from '../utils/app-error';
import { errorHandler } from './error-handler';

const next = vi.fn() as unknown as NextFunction;

function mockResponse() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response & { status: any; json: any };
}

describe('errorHandler middleware', () => {
  it('should format AppError with exact { error: { code, message, details } }', () => {
    const res = mockResponse();
    const error = new AppError('Folio not found', 404, ErrorCode.NOT_FOUND, { folioId: '123' });

    errorHandler(error, {} as Request, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: ErrorCode.NOT_FOUND,
        message: 'Folio not found',
        details: { folioId: '123' },
      },
    });
  });

  it('should format ZodError as 400 VALIDATION_ERROR', () => {
    const res = mockResponse();
    const schema = z.object({ email: z.string().email() });
    let zodErr: ZodError | null = null;
    try {
      schema.parse({ email: 'invalid-email' });
    } catch (e: any) {
      zodErr = e;
    }

    errorHandler(zodErr!, {} as Request, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Validation failed',
          details: expect.objectContaining({
            email: expect.any(Array),
          }),
        }),
      })
    );
  });

  it('should map PostgreSQL 23P01 exclusion violation to 409 ROOM_UNAVAILABLE', () => {
    const res = mockResponse();
    const pgError = {
      message: 'conflicting key value violates exclusion constraint "no_overlapping_reservations"',
      meta: { code: '23P01' },
    };

    errorHandler(pgError as any, {} as Request, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: ErrorCode.ROOM_UNAVAILABLE,
        message: 'Room is no longer available for the selected dates',
        details: { code: '23P01' },
      },
    });
  });

  it('should map Prisma P2002 unique constraint violation to 409 CONFLICT', () => {
    const res = mockResponse();
    const prismaError = {
      code: 'P2002',
      message: 'Unique constraint failed on the fields: (`email`)',
      meta: { target: ['email'] },
    };

    errorHandler(prismaError as any, {} as Request, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: ErrorCode.CONFLICT,
        message: 'A record with this email already exists.',
        details: { target: ['email'] },
      },
    });
  });

  it('should map PostgreSQL 23514 check constraint violation to 400 VALIDATION_ERROR', () => {
    const res = mockResponse();
    const checkError = {
      message: 'new row for relation "reservations" violates check constraint "check_out_after_check_in"',
      meta: { code: '23514' },
    };

    errorHandler(checkError as any, {} as Request, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Check constraint violation: provided dates or values are invalid.',
        details: { code: '23514' },
      },
    });
  });

  it('should map audit_logs append-only trigger exception to 403 FORBIDDEN', () => {
    const res = mockResponse();
    const triggerError = new Error('audit_logs is append-only; updates and deletes are forbidden');

    errorHandler(triggerError, {} as Request, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: ErrorCode.FORBIDDEN,
        message: 'audit_logs is append-only; updates and deletes are forbidden',
        details: null,
      },
    });
  });

  it('should map financial deletion trigger exception to 403 FORBIDDEN', () => {
    const res = mockResponse();
    const triggerError = new Error('Financial records cannot be deleted. Use reversal or refund instead.');

    errorHandler(triggerError, {} as Request, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: ErrorCode.FORBIDDEN,
        message: 'Financial records cannot be deleted. Use reversal or refund instead.',
        details: null,
      },
    });
  });

  it('should map unexpected error to 500 INTERNAL_ERROR', () => {
    const res = mockResponse();
    const rawError = new Error('Database connection drop');

    errorHandler(rawError, {} as Request, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Internal server error',
        details: null,
      },
    });
  });
});
