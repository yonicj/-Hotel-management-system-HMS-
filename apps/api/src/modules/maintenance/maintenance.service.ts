import { prisma } from '../../config/database';
import { AppError } from '../../shared/utils/app-error';
import { ErrorCode } from '@ehms/types';
import { MaintenanceStatus, TaskPriority } from '@prisma/client';
import { recordAuditLog, AUDIT_ACTIONS } from '../../shared/utils/audit';

export async function getMaintenanceReports(roomId?: string) {
  const where = roomId ? { roomId } : {};
  return prisma.maintenanceReport.findMany({
    where,
    include: {
      room: true,
      reportedByUser: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      resolvedByUser: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
    orderBy: { reportedAt: 'desc' },
  });
}

export async function getMaintenanceReportById(id: string) {
  const report = await prisma.maintenanceReport.findUnique({
    where: { id },
    include: {
      room: true,
      reportedByUser: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      resolvedByUser: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });
  if (!report) {
    throw new AppError('Maintenance report not found', 404, ErrorCode.NOT_FOUND);
  }
  return report;
}

export async function createMaintenanceReport(
  data: { roomId: string; issueType: string; description: string; priority?: TaskPriority },
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    const report = await tx.maintenanceReport.create({
      data: {
        roomId: data.roomId,
        issueType: data.issueType,
        description: data.description,
        priority: data.priority || 'NORMAL',
        reportedBy: userId,
      },
    });

    await recordAuditLog({
      userId,
      action: AUDIT_ACTIONS.MAINTENANCE_REPORT_CREATED,
      entityType: 'MaintenanceReport',
      entityId: report.id,
      changes: {
        before: null,
        after: {
          roomId: data.roomId,
          issueType: data.issueType,
          description: data.description,
          priority: report.priority,
          status: report.status,
        },
      },
      tx,
    });

    return report;
  });
}

export async function updateMaintenanceStatus(
  id: string,
  status: MaintenanceStatus,
  userId: string
) {
  const existing = await getMaintenanceReportById(id);
  const isResolved = status === 'RESOLVED';

  return prisma.$transaction(async (tx) => {
    const updated = await tx.maintenanceReport.update({
      where: { id },
      data: {
        status,
        resolvedBy: isResolved ? userId : undefined,
        resolvedAt: isResolved ? new Date() : undefined,
      },
    });

    await recordAuditLog({
      userId,
      action: AUDIT_ACTIONS.MAINTENANCE_STATUS_UPDATED,
      entityType: 'MaintenanceReport',
      entityId: id,
      changes: {
        before: { status: existing.status, resolvedBy: existing.resolvedBy },
        after: { status, resolvedBy: isResolved ? userId : existing.resolvedBy },
      },
      tx,
    });

    return updated;
  });
}
