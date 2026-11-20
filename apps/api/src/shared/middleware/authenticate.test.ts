import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate } from './authenticate';
import { env } from '../../config/env';
import { redis } from '../../config/redis';
import { AppError } from '../utils/app-error';
import { ErrorCode } from '@ehms/types';

vi.mock('../../config/redis', () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}));

describe('authenticate middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { headers: {} };
    res = {};
    next = vi.fn() as unknown as NextFunction;
  });

  it('should return 401 UNAUTHORIZED when Authorization header is missing', async () => {
    await authenticate(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as any).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe(ErrorCode.UNAUTHORIZED);
    expect(err.message).toBe('Authentication required');
  });

  it('should return 401 UNAUTHORIZED when token is blacklisted/revoked', async () => {
    const token = 'revoked-token-xyz';
    req.headers = { authorization: `Bearer ${token}` };

    vi.mocked(redis.get).mockResolvedValueOnce('1'); // revoked

    await authenticate(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as any).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe(ErrorCode.UNAUTHORIZED);
    expect(err.message).toBe('Token has been revoked');
  });

  it('should return 401 UNAUTHORIZED when token has invalid signature', async () => {
    req.headers = { authorization: 'Bearer invalid.jwt.token' };
    vi.mocked(redis.get).mockResolvedValueOnce(null);

    await authenticate(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as any).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe(ErrorCode.UNAUTHORIZED);
    expect(err.message).toBe('Invalid or expired token');
  });

  it('should authenticate valid token and populate req.user and req.token', async () => {
    const payload = {
      userId: 'user-123',
      email: 'admin@grandhotel.com',
      role: 'Super Admin',
      hotelId: 'hotel-001',
    };
    const token = jwt.sign(payload, env.JWT_ACCESS_SECRET);
    req.headers = { authorization: `Bearer ${token}` };
    vi.mocked(redis.get).mockResolvedValueOnce(null);

    await authenticate(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toBeDefined();
    expect(req.user?.userId).toBe('user-123');
    expect(req.user?.email).toBe('admin@grandhotel.com');
    expect(req.token).toBe(token);
  });
});
