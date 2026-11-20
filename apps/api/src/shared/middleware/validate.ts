import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/app-error';
import { ErrorCode } from '@ehms/types';

type ValidateTarget = 'body' | 'query' | 'params';

/**
 * Zod validation middleware factory.
 * Usage: router.post('/', validate(createReservationSchema), controller)
 */
export function validate(schema: ZodSchema, target: ValidateTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[target]);
      req[target] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        err.errors.forEach((e) => {
          const key = e.path.join('.') || 'root';
          if (!errors[key]) errors[key] = [];
          errors[key].push(e.message);
        });
        const appErr = new AppError('Validation failed', 400, ErrorCode.VALIDATION_ERROR, errors);
        next(appErr);
      } else {
        next(err);
      }
    }
  };
}
