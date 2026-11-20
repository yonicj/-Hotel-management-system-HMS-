import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { PERMISSIONS, ROLES } from '@ehms/config';
import { ErrorCode } from '@ehms/types';
import { authorize } from './authorize';
import * as redisModule from '../../config/redis';
import { prisma } from '../../config/database';
import { AppError } from '../utils/app-error';

vi.mock('../../config/redis', () => ({
  getCache: vi.fn(),
  setCache: vi.fn(),
}));

vi.mock('../../config/database', () => ({
  prisma: {
    role: {
      findFirst: vi.fn(),
    },
  },
}));

describe('authorize middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {};
    res = {};
    next = vi.fn() as unknown as NextFunction;
  });

  it('should return 401 UNAUTHORIZED when req.user is missing', async () => {
    const middleware = authorize(PERMISSIONS.RESERVATIONS_READ);
    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as any).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe(ErrorCode.UNAUTHORIZED);
  });

  it('should immediately allow Super Admin without DB or cache lookup', async () => {
    req.user = {
      userId: 'admin-1',
      email: 'admin@grandhotel.com',
      role: ROLES.SUPER_ADMIN,
      hotelId: 'hotel-1',
    };

    const middleware = authorize(PERMISSIONS.USERS_DELETE);
    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(redisModule.getCache).not.toHaveBeenCalled();
    expect(prisma.role.findFirst).not.toHaveBeenCalled();
  });

  it('should allow user when cached permissions contain the required permission', async () => {
    req.user = {
      userId: 'user-1',
      email: 'rec@grandhotel.com',
      role: ROLES.RECEPTIONIST,
      hotelId: 'hotel-1',
    };

    vi.mocked(redisModule.getCache).mockResolvedValueOnce([
      'reservations:read',
      'reservations:create',
    ]);

    const middleware = authorize(PERMISSIONS.RESERVATIONS_READ);
    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(redisModule.getCache).toHaveBeenCalledWith(`permissions:role:${ROLES.RECEPTIONIST}`);
  });

  it('should reject user with 403 FORBIDDEN when permission is missing', async () => {
    req.user = {
      userId: 'user-2',
      email: 'accountant@grandhotel.com',
      role: ROLES.ACCOUNTANT,
      hotelId: 'hotel-1',
    };

    vi.mocked(redisModule.getCache).mockResolvedValueOnce([
      'billing:read',
      'billing:create',
    ]);

    const middleware = authorize(PERMISSIONS.BILLING_DELETE);
    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as any).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe(ErrorCode.FORBIDDEN);
  });

  it('should support legacy resource + action arguments', async () => {
    req.user = {
      userId: 'user-3',
      email: 'rec@grandhotel.com',
      role: ROLES.RECEPTIONIST,
      hotelId: 'hotel-1',
    };

    vi.mocked(redisModule.getCache).mockResolvedValueOnce(['reservations:read']);

    const middleware = authorize('reservations', 'read');
    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith();
  });
});
