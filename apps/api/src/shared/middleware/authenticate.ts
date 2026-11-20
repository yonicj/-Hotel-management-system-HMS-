import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { redis } from '../../config/redis';
import { AppError } from '../utils/app-error';
import { ErrorCode } from '@ehms/types';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  hotelId: string;
  exp?: number;
}

// Extend Express Request to include authenticated user and token
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      token?: string;
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401, ErrorCode.UNAUTHORIZED));
  }

  const token = authHeader.split(' ')[1];

  try {
    // Check if access token is blacklisted/revoked
    try {
      const isRevoked = await redis.get(`bl:access:${token}`);
      if (isRevoked) {
        return next(new AppError('Token has been revoked', 401, ErrorCode.UNAUTHORIZED));
      }
    } catch (redisErr) {
      // Non-fatal if Redis connection error, log and continue verification
      console.error('Redis token revocation check error:', redisErr);
    }

    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    req.user = payload;
    req.token = token;
    next();
  } catch (err: any) {
    if (err instanceof AppError) {
      return next(err);
    }
    return next(new AppError('Invalid or expired token', 401, ErrorCode.UNAUTHORIZED));
  }
}
