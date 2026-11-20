import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';

export interface RecordAuditLogParams {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, any> | null;
  tx?: Prisma.TransactionClient | PrismaClient;
}

export const AUDIT_ACTIONS = {
  // Authentication
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  TOKEN_REFRESH: 'TOKEN_REFRESH',
  LOGOUT: 'LOGOUT',

  // Reservations
  RESERVATION_CREATED: 'RESERVATION_CREATED',
  RESERVATION_CONFIRMED: 'RESERVATION_CONFIRMED',
  RESERVATION_CANCELLED: 'RESERVATION_CANCELLED',
  RESERVATION_NO_SHOW: 'RESERVATION_NO_SHOW',
  RESERVATION_COMPLETED: 'RESERVATION_COMPLETED',
  ROOM_ASSIGNED: 'ROOM_ASSIGNED',

  // Front Desk
  CHECK_IN: 'CHECK_IN',
  CHECK_OUT: 'CHECK_OUT',

  // Rooms
  ROOM_STATUS_UPDATED: 'ROOM_STATUS_UPDATED',
  ROOM_CREATED: 'ROOM_CREATED',

  // Housekeeping
  HOUSEKEEPING_TASK_CREATED: 'HOUSEKEEPING_TASK_CREATED',
  HOUSEKEEPING_TASK_UPDATED: 'HOUSEKEEPING_TASK_UPDATED',

  // Maintenance
  MAINTENANCE_REPORT_CREATED: 'MAINTENANCE_REPORT_CREATED',
  MAINTENANCE_STATUS_UPDATED: 'MAINTENANCE_STATUS_UPDATED',

  // Financial & Billing
  FOLIO_CHARGE_POSTED: 'FOLIO_CHARGE_POSTED',
  PAYMENT_RECORDED: 'PAYMENT_RECORDED',
  FOLIO_CLOSED: 'FOLIO_CLOSED',
  MANAGER_OVERRIDE: 'MANAGER_OVERRIDE',

  // Night Audit
  NIGHT_AUDIT_COMPLETED: 'NIGHT_AUDIT_COMPLETED',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS] | string;

export async function resolveSystemUserId(
  client: Prisma.TransactionClient | PrismaClient
): Promise<string> {
  try {
    const admin = await client.user.findFirst({
      where: { role: { name: 'Super Admin' } },
      select: { id: true },
    });
    if (admin) return admin.id;

    const anyUser = await client.user.findFirst({ select: { id: true } });
    if (anyUser) return anyUser.id;
  } catch {
    // If DB is disconnected or mocked without findFirst
  }
  return '00000000-0000-0000-0000-000000000000';
}

export async function recordAuditLog(params: RecordAuditLogParams) {
  const client = params.tx ?? prisma;
  let userId = params.userId;

  if (!userId || userId.toLowerCase() === 'system' || userId === 'SYSTEM_FALLBACK') {
    userId = await resolveSystemUserId(client);
  }

  try {
    return await client.auditLog.create({
      data: {
        userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        changes: params.changes !== undefined ? (params.changes as any) : undefined,
      },
    });
  } catch (error: any) {
    // If foreign key constraint failed on user_id, fallback to system admin
    if (error?.code === 'P2003' || error?.message?.includes('foreign key constraint')) {
      const systemUserId = await resolveSystemUserId(client);
      return client.auditLog.create({
        data: {
          userId: systemUserId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          changes: {
            attemptedUserId: params.userId,
            ...(params.changes || {}),
          },
        },
      });
    }
    throw error;
  }
}

export async function recordManagerOverride(params: {
  userId: string;
  reason: string;
  entityType: string;
  entityId: string;
  changes: Record<string, any>;
  tx?: Prisma.TransactionClient | PrismaClient;
}) {
  return recordAuditLog({
    userId: params.userId,
    action: AUDIT_ACTIONS.MANAGER_OVERRIDE,
    entityType: params.entityType,
    entityId: params.entityId,
    changes: {
      overrideReason: params.reason,
      ...params.changes,
    },
    tx: params.tx,
  });
}
