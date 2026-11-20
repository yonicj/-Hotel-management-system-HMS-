import { prisma } from '../../config/database';
import { AppError } from '../../shared/utils/app-error';
import { ErrorCode } from '@ehms/types';

export async function getAuditLogs(
  entityType?: string,
  entityId?: string,
  action?: string,
  userId?: string
) {
  const where: any = {};
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (action) where.action = action;
  if (userId) where.userId = userId;

  return prisma.auditLog.findMany({
    where,
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export async function getAuditLogById(id: string) {
  const log = await prisma.auditLog.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });
  if (!log) {
    throw new AppError('Audit log entry not found', 404, ErrorCode.NOT_FOUND);
  }
  return log;
}
