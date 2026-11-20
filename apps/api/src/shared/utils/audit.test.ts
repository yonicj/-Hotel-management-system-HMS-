import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recordAuditLog, recordManagerOverride, resolveSystemUserId, AUDIT_ACTIONS } from './audit';
import { prisma } from '../../config/database';

vi.mock('../../config/database', () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

describe('Audit Utility (recordAuditLog & recordManagerOverride)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('recordAuditLog', () => {
    it('should create an audit log entry with direct prisma client', async () => {
      vi.mocked(prisma.auditLog.create).mockResolvedValueOnce({ id: 'audit-1' } as any);

      const result = await recordAuditLog({
        userId: 'user-123',
        action: AUDIT_ACTIONS.ROOM_STATUS_UPDATED,
        entityType: 'Room',
        entityId: 'room-101',
        changes: { before: { status: 'AVAILABLE' }, after: { status: 'OCCUPIED' } },
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          action: 'ROOM_STATUS_UPDATED',
          entityType: 'Room',
          entityId: 'room-101',
          changes: { before: { status: 'AVAILABLE' }, after: { status: 'OCCUPIED' } },
        },
      });
      expect(result).toEqual({ id: 'audit-1' });
    });

    it('should use the provided transaction client (tx) when supplied', async () => {
      const mockTx = {
        auditLog: {
          create: vi.fn().mockResolvedValueOnce({ id: 'audit-tx-1' }),
        },
      } as any;

      const result = await recordAuditLog({
        userId: 'user-456',
        action: AUDIT_ACTIONS.FOLIO_CHARGE_POSTED,
        entityType: 'FolioCharge',
        entityId: 'charge-1',
        changes: { amount: '150.00' },
        tx: mockTx,
      });

      expect(mockTx.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-456',
          action: 'FOLIO_CHARGE_POSTED',
          entityType: 'FolioCharge',
          entityId: 'charge-1',
          changes: { amount: '150.00' },
        },
      });
      expect(prisma.auditLog.create).not.toHaveBeenCalled();
      expect(result).toEqual({ id: 'audit-tx-1' });
    });

    it('should resolve system user when userId is "system"', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({ id: 'admin-super-id' } as any);
      vi.mocked(prisma.auditLog.create).mockResolvedValueOnce({ id: 'audit-sys-1' } as any);

      await recordAuditLog({
        userId: 'system',
        action: AUDIT_ACTIONS.LOGIN_FAILED,
        entityType: 'User',
        entityId: 'unknown@example.com',
        changes: { attemptedEmail: 'unknown@example.com', reason: 'USER_NOT_FOUND' },
      });

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { role: { name: 'Super Admin' } },
        select: { id: true },
      });
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'admin-super-id',
          action: 'LOGIN_FAILED',
          entityType: 'User',
          entityId: 'unknown@example.com',
          changes: { attemptedEmail: 'unknown@example.com', reason: 'USER_NOT_FOUND' },
        },
      });
    });

    it('should recover from foreign key violation (P2003) and fallback to system user', async () => {
      const p2003Error = new Error('Foreign key constraint failed on user_id');
      (p2003Error as any).code = 'P2003';

      vi.mocked(prisma.auditLog.create)
        .mockRejectedValueOnce(p2003Error) // First attempt fails with FK error
        .mockResolvedValueOnce({ id: 'audit-recovered' } as any); // Fallback succeeds

      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({ id: 'fallback-admin-id' } as any);

      const result = await recordAuditLog({
        userId: 'deleted-or-nonexistent-user',
        action: AUDIT_ACTIONS.LOGOUT,
        entityType: 'User',
        entityId: 'deleted-or-nonexistent-user',
        changes: { details: 'forced logout' },
      });

      expect(prisma.auditLog.create).toHaveBeenCalledTimes(2);
      expect(prisma.auditLog.create).toHaveBeenLastCalledWith({
        data: {
          userId: 'fallback-admin-id',
          action: 'LOGOUT',
          entityType: 'User',
          entityId: 'deleted-or-nonexistent-user',
          changes: {
            attemptedUserId: 'deleted-or-nonexistent-user',
            details: 'forced logout',
          },
        },
      });
      expect(result).toEqual({ id: 'audit-recovered' });
    });
  });

  describe('recordManagerOverride', () => {
    it('should record audit log with MANAGER_OVERRIDE action and reason in changes', async () => {
      vi.mocked(prisma.auditLog.create).mockResolvedValueOnce({ id: 'audit-override-1' } as any);

      const result = await recordManagerOverride({
        userId: 'manager-1',
        reason: 'VIP complimentary rate approval',
        entityType: 'Reservation',
        entityId: 'res-101',
        changes: { originalRate: '200.00', discountedRate: '0.00' },
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'manager-1',
          action: AUDIT_ACTIONS.MANAGER_OVERRIDE,
          entityType: 'Reservation',
          entityId: 'res-101',
          changes: {
            overrideReason: 'VIP complimentary rate approval',
            originalRate: '200.00',
            discountedRate: '0.00',
          },
        },
      });
      expect(result).toEqual({ id: 'audit-override-1' });
    });
  });

  describe('resolveSystemUserId', () => {
    it('should return Super Admin user id if found', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({ id: 'admin-uuid' } as any);
      const id = await resolveSystemUserId(prisma);
      expect(id).toBe('admin-uuid');
    });

    it('should fallback to any existing user id if Super Admin not found', async () => {
      vi.mocked(prisma.user.findFirst)
        .mockResolvedValueOnce(null) // Super admin not found
        .mockResolvedValueOnce({ id: 'any-user-uuid' } as any); // Any user found

      const id = await resolveSystemUserId(prisma);
      expect(id).toBe('any-user-uuid');
    });

    it('should return zero-uuid if no users found or error thrown', async () => {
      vi.mocked(prisma.user.findFirst).mockRejectedValueOnce(new Error('DB unreachable'));
      const id = await resolveSystemUserId(prisma);
      expect(id).toBe('00000000-0000-0000-0000-000000000000');
    });
  });
});
