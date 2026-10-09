import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { AppError } from '../../shared/utils/app-error';
import { CreateUserInput, UpdateUserInput } from './users.schema';
import { parsePaginationParams, buildPaginationMeta, getSkip } from '@hms/shared-utils';

export async function getUsers(hotelId: string, rawPage: unknown, rawLimit: unknown) {
  const { page, limit } = parsePaginationParams(rawPage, rawLimit);
  const skip = getSkip(page, limit);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: { hotelId },
      select: { id: true, firstName: true, lastName: true, email: true, isActive: true, lastLogin: true, createdAt: true, role: { select: { id: true, name: true } } },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where: { hotelId } }),
  ]);

  return { users, pagination: buildPaginationMeta(page, limit, total) };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, firstName: true, lastName: true, email: true, isActive: true, lastLogin: true, createdAt: true, role: true },
  });
  if (!user) throw new AppError('User not found', 404);
  return user;
}

export async function createUser(input: CreateUserInput) {
  const exists = await prisma.user.findUnique({ where: { email: input.email } });
  if (exists) throw new AppError('Email already in use', 409);

  const passwordHash = await bcrypt.hash(input.password, 12);
  return prisma.user.create({
    data: { ...input, passwordHash, password: undefined } as any,
    select: { id: true, firstName: true, lastName: true, email: true, isActive: true, createdAt: true },
  });
}

export async function updateUser(id: string, input: UpdateUserInput) {
  await getUserById(id);
  return prisma.user.update({
    where: { id },
    data: input,
    select: { id: true, firstName: true, lastName: true, email: true, isActive: true },
  });
}

export async function deleteUser(id: string) {
  await getUserById(id);
  await prisma.user.update({ where: { id }, data: { isActive: false } });
}
