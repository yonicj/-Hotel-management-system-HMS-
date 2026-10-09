import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { env } from '../../config/env';
import { AppError } from '../../shared/utils/app-error';
import { LoginInput } from './auth.schema';

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { role: true },
  });

  if (!user || !user.isActive) {
    throw new AppError('Invalid email or password', 401);
  }

  const isMatch = await bcrypt.compare(input.password, user.passwordHash);
  if (!isMatch) throw new AppError('Invalid email or password', 401);

  // Update last login
  await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role.name,
    hotelId: user.hotelId,
  };

  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });

  // Store refresh token in Redis (7 days TTL)
  await redis.set(`refresh:${user.id}`, refreshToken, 'EX', 7 * 24 * 60 * 60);

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
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as {
      userId: string;
      email: string;
      role: string;
      hotelId: string;
    };

    const stored = await redis.get(`refresh:${payload.userId}`);
    if (!stored || stored !== token) throw new AppError('Invalid refresh token', 401);

    const newAccessToken = jwt.sign(
      { userId: payload.userId, email: payload.email, role: payload.role, hotelId: payload.hotelId },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
    );

    return { accessToken: newAccessToken };
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }
}

export async function logout(userId: string) {
  await redis.del(`refresh:${userId}`);
}
