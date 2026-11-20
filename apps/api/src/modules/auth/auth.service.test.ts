import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { login, refreshTokens, logout } from './auth.service';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { env } from '../../config/env';
import { ErrorCode } from '@ehms/types';
import { AUDIT_ACTIONS } from '../../shared/utils/audit';

vi.mock('../../config/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn().mockResolvedValue({ id: 'mock-audit-id' }),
    },
  },
}));

vi.mock('../../config/redis', () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}));

describe('Auth Service - Token Lifecycle, Revocation & Audit Logging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should throw 401 and log LOGIN_FAILED when user does not exist', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({ id: 'admin-1' } as any);

      await expect(
        login({ email: 'nonexistent@example.com', password: 'password123' })
      ).rejects.toMatchObject({
        statusCode: 401,
        code: ErrorCode.UNAUTHORIZED,
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'admin-1',
          action: AUDIT_ACTIONS.LOGIN_FAILED,
          entityType: 'User',
          entityId: 'nonexistent@example.com',
          changes: { attemptedEmail: 'nonexistent@example.com', reason: 'USER_NOT_FOUND' },
        },
      });
    });

    it('should throw 401 and log LOGIN_FAILED when user is inactive', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'u-inactive',
        email: 'inactive@example.com',
        isActive: false,
        role: { name: 'Receptionist' },
      } as any);

      await expect(
        login({ email: 'inactive@example.com', password: 'password123' })
      ).rejects.toMatchObject({
        statusCode: 401,
        code: ErrorCode.UNAUTHORIZED,
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'u-inactive',
          action: AUDIT_ACTIONS.LOGIN_FAILED,
          entityType: 'User',
          entityId: 'u-inactive',
          changes: { attemptedEmail: 'inactive@example.com', reason: 'ACCOUNT_INACTIVE' },
        },
      });
    });

    it('should throw 401 and log LOGIN_FAILED when password is incorrect', async () => {
      const hash = await bcrypt.hash('CorrectPass123', 4);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'u-user',
        email: 'user@example.com',
        passwordHash: hash,
        isActive: true,
        role: { name: 'Receptionist' },
      } as any);

      await expect(
        login({ email: 'user@example.com', password: 'WrongPassword' })
      ).rejects.toMatchObject({
        statusCode: 401,
        code: ErrorCode.UNAUTHORIZED,
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'u-user',
          action: AUDIT_ACTIONS.LOGIN_FAILED,
          entityType: 'User',
          entityId: 'u-user',
          changes: { attemptedEmail: 'user@example.com', reason: 'INVALID_PASSWORD' },
        },
      });
    });

    it('should succeed, update lastLogin, and log LOGIN_SUCCESS on valid credentials', async () => {
      const hash = await bcrypt.hash('CorrectPass123', 4);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'u-user',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        passwordHash: hash,
        isActive: true,
        hotelId: 'h1',
        role: { name: 'Receptionist' },
      } as any);
      vi.mocked(prisma.user.update).mockResolvedValueOnce({} as any);

      const result = await login({ email: 'user@example.com', password: 'CorrectPass123' });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe('user@example.com');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u-user' },
        data: { lastLogin: expect.any(Date) },
      });
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'u-user',
          action: AUDIT_ACTIONS.LOGIN_SUCCESS,
          entityType: 'User',
          entityId: 'u-user',
          changes: {
            email: 'user@example.com',
            role: 'Receptionist',
            hotelId: 'h1',
          },
        },
      });
    });
  });

  describe('refreshTokens', () => {
    it('should throw 401 UNAUTHORIZED if refresh token is missing', async () => {
      await expect(refreshTokens('')).rejects.toMatchObject({
        statusCode: 401,
        code: ErrorCode.UNAUTHORIZED,
        message: 'Refresh token required',
      });
    });

    it('should throw 401 UNAUTHORIZED if refresh token is in blacklist', async () => {
      vi.mocked(redis.get).mockResolvedValueOnce('1'); // blacklisted

      await expect(refreshTokens('blacklisted-token')).rejects.toMatchObject({
        statusCode: 401,
        code: ErrorCode.UNAUTHORIZED,
        message: 'Refresh token has been revoked',
      });
    });

    it('should throw 401 UNAUTHORIZED if signature is invalid', async () => {
      vi.mocked(redis.get).mockResolvedValueOnce(null);

      await expect(refreshTokens('tampered-token')).rejects.toMatchObject({
        statusCode: 401,
        code: ErrorCode.UNAUTHORIZED,
        message: 'Invalid or expired refresh token',
      });
    });

    it('should throw 401 UNAUTHORIZED if token does not match active token in Redis', async () => {
      const payload = { userId: 'u1', email: 'a@b.com', role: 'Super Admin', hotelId: 'h1' };
      const token = jwt.sign(payload, env.JWT_REFRESH_SECRET);

      vi.mocked(redis.get)
        .mockResolvedValueOnce(null) // not blacklisted
        .mockResolvedValueOnce('different-token'); // stored mismatch

      await expect(refreshTokens(token)).rejects.toMatchObject({
        statusCode: 401,
        code: ErrorCode.UNAUTHORIZED,
        message: 'Invalid or expired refresh token',
      });
    });

    it('should throw 401 UNAUTHORIZED if user is inactive in DB', async () => {
      const payload = { userId: 'u1', email: 'a@b.com', role: 'Super Admin', hotelId: 'h1' };
      const token = jwt.sign(payload, env.JWT_REFRESH_SECRET);

      vi.mocked(redis.get)
        .mockResolvedValueOnce(null) // not blacklisted
        .mockResolvedValueOnce(token); // stored matches

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'u1',
        isActive: false, // inactive user
      } as any);

      await expect(refreshTokens(token)).rejects.toMatchObject({
        statusCode: 401,
        code: ErrorCode.UNAUTHORIZED,
        message: 'User account is inactive or no longer exists',
      });

      expect(redis.del).toHaveBeenCalledWith('refresh:u1');
      expect(redis.set).toHaveBeenCalledWith(`bl:refresh:${token}`, '1', 'EX', 7 * 24 * 60 * 60);
    });

    it('should rotate tokens, log TOKEN_REFRESH, and return fresh token pair for active user', async () => {
      const payload = { userId: 'u1', email: 'a@b.com', role: 'Super Admin', hotelId: 'h1' };
      const token = jwt.sign(payload, env.JWT_REFRESH_SECRET);

      vi.mocked(redis.get)
        .mockResolvedValueOnce(null) // not blacklisted
        .mockResolvedValueOnce(token); // stored matches

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'u1',
        email: 'a@b.com',
        isActive: true,
        hotelId: 'h1',
        role: { name: 'Super Admin' },
      } as any);

      const result = await refreshTokens(token);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.refreshToken).not.toBe(token); // rotated!

      // Old refresh token must be blacklisted
      expect(redis.set).toHaveBeenCalledWith(`bl:refresh:${token}`, '1', 'EX', 7 * 24 * 60 * 60);
      // New refresh token must be saved
      expect(redis.set).toHaveBeenCalledWith('refresh:u1', result.refreshToken, 'EX', 7 * 24 * 60 * 60);

      // Audit log must be captured
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          action: AUDIT_ACTIONS.TOKEN_REFRESH,
          entityType: 'User',
          entityId: 'u1',
          changes: { email: 'a@b.com' },
        },
      });
    });
  });

  describe('logout', () => {
    it('should delete active refresh token, blacklist access/refresh tokens, and log LOGOUT', async () => {
      const accessToken = jwt.sign({ userId: 'u1', exp: Math.floor(Date.now() / 1000) + 900 }, env.JWT_ACCESS_SECRET);
      const refreshToken = 'refresh-to-blacklist';

      await logout('u1', accessToken, refreshToken);

      expect(redis.del).toHaveBeenCalledWith('refresh:u1');
      expect(redis.set).toHaveBeenCalledWith(`bl:refresh:${refreshToken}`, '1', 'EX', 7 * 24 * 60 * 60);
      expect(redis.set).toHaveBeenCalledWith(`bl:access:${accessToken}`, '1', 'EX', expect.any(Number));

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          action: AUDIT_ACTIONS.LOGOUT,
          entityType: 'User',
          entityId: 'u1',
          changes: { timestamp: expect.any(String) },
        },
      });
    });
  });
});
