import { prisma } from '../../config/database';
import { AppError } from '../../shared/utils/app-error';
import { ErrorCode } from '@ehms/types';

export async function getRoles() {
  return prisma.role.findMany({
    include: {
      rolePermissions: {
        include: { permission: true },
      },
    },
    orderBy: { name: 'asc' },
  });
}

export async function getRoleById(id: string) {
  const role = await prisma.role.findUnique({
    where: { id },
    include: {
      rolePermissions: {
        include: { permission: true },
      },
    },
  });
  if (!role) {
    throw new AppError('Role not found', 404, ErrorCode.NOT_FOUND);
  }
  return role;
}
