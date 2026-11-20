import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { env } from '../../config/env';
import { AppError } from '../../shared/utils/app-error';
import { ErrorCode } from '@ehms/types';
import { recordAuditLog, AUDIT_ACTIONS } from '../../shared/utils/audit';
import { LoginInput } from './auth.schema';

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { role: true },
  });

  if (!user) {
    await recordAuditLog({
      userId: 'system',
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      entityType: 'User',
      entityId: input.email,
      changes: { attemptedEmail: input.email, reason: 'USER_NOT_FOUND' },
    });
    throw new AppError('Invalid email or password', 401, ErrorCode.UNAUTHORIZED);
  }

  if (!user.isActive) {
    await recordAuditLog({
      userId: user.id,
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      entityType: 'User',
      entityId: user.id,
      changes: { attemptedEmail: input.email, reason: 'ACCOUNT_INACTIVE' },
    });
    throw new AppError('Invalid email or password', 401, ErrorCode.UNAUTHORIZED);
  }

  const isMatch = await bcrypt.compare(input.password, user.passwordHash);
  if (!isMatch) {
    await recordAuditLog({
      userId: user.id,
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      entityType: 'User',
      entityId: user.id,
      changes: { attemptedEmail: input.email, reason: 'INVALID_PASSWORD' },
    });
    throw new AppError('Invalid email or password', 401, ErrorCode.UNAUTHORIZED);
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role.name,
    hotelId: user.hotelId,
    jti: crypto.randomUUID(),
  };

  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as any);

  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as any);

  // Store active refresh token with 7-day TTL
  await redis.set(`refresh:${user.id}`, refreshToken, 'EX', 7 * 24 * 60 * 60);

  await recordAuditLog({
    userId: user.id,
    action: AUDIT_ACTIONS.LOGIN_SUCCESS,
    entityType: 'User',
    entityId: user.id,
    changes: {
      email: user.email,
      role: user.role.name,
      hotelId: user.hotelId,
    },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
      hotelId: user.hotelId,
    },
  };
}

export async function refreshTokens(token: string) {
  if (!token) {
    throw new AppError('Refresh token required', 401, ErrorCode.UNAUTHORIZED);
  }

  // 1. Check if token is in the revocation blacklist
  const isRevoked = await redis.get(`bl:refresh:${token}`);
  if (isRevoked) {
    throw new AppError('Refresh token has been revoked', 401, ErrorCode.UNAUTHORIZED);
  }

  // 2. Validate token signature and expiration
  let payload: { userId: string; email: string; role: string; hotelId: string };
  try {
    payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as any;
  } catch {
    throw new AppError('Invalid or expired refresh token', 401, ErrorCode.UNAUTHORIZED);
  }

  // 3. Verify token against active stored token in Redis
  const stored = await redis.get(`refresh:${payload.userId}`);
  if (!stored || stored !== token) {
    throw new AppError('Invalid or expired refresh token', 401, ErrorCode.UNAUTHORIZED);
  }

  // 4. Verify user existence and active status in DB
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { role: true },
  });

  if (!user || !user.isActive) {
    // Revoke token immediately
    await redis.del(`refresh:${payload.userId}`);
    await redis.set(`bl:refresh:${token}`, '1', 'EX', 7 * 24 * 60 * 60);
    throw new AppError('User account is inactive or no longer exists', 401, ErrorCode.UNAUTHORIZED);
  }

  // 5. Rotate and issue a fresh token pair
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role.name,
    hotelId: user.hotelId,
    jti: crypto.randomUUID(),
  };

  const newAccessToken = jwt.sign(tokenPayload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as any);

  const newRefreshToken = jwt.sign(tokenPayload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as any);

  // Blacklist old refresh token so it cannot be reused
  await redis.set(`bl:refresh:${token}`, '1', 'EX', 7 * 24 * 60 * 60);
  // Store new active refresh token
  await redis.set(`refresh:${user.id}`, newRefreshToken, 'EX', 7 * 24 * 60 * 60);

  await recordAuditLog({
    userId: user.id,
    action: AUDIT_ACTIONS.TOKEN_REFRESH,
    entityType: 'User',
    entityId: user.id,
    changes: {
      email: user.email,
    },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

export async function logout(userId: string, accessToken?: string, refreshToken?: string) {
  // Delete active refresh token
  await redis.del(`refresh:${userId}`);

  // Blacklist the refresh token if provided
  if (refreshToken) {
    await redis.set(`bl:refresh:${refreshToken}`, '1', 'EX', 7 * 24 * 60 * 60);
  }

  // Blacklist the active access token until its expiry
  if (accessToken) {
    try {
      const decoded = jwt.decode(accessToken) as { exp?: number } | null;
      const exp = decoded?.exp;
      const now = Math.floor(Date.now() / 1000);
      const ttl = exp && exp > now ? exp - now : 15 * 60;
      await redis.set(`bl:access:${accessToken}`, '1', 'EX', ttl);
    } catch {
      await redis.set(`bl:access:${accessToken}`, '1', 'EX', 15 * 60);
    }
  }

  await recordAuditLog({
    userId,
    action: AUDIT_ACTIONS.LOGOUT,
    entityType: 'User',
    entityId: userId,
    changes: {
      timestamp: new Date().toISOString(),
    },
  });
}
