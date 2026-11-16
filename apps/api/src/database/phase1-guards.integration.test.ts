import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupTestData() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE folio_charges DISABLE TRIGGER trg_folio_charges_prevent_delete;`);
    await prisma.$executeRawUnsafe(`DELETE FROM folio_charges WHERE description LIKE '%Integration test%' OR description LIKE '%Guard Test%';`);
    await prisma.$executeRawUnsafe(`ALTER TABLE folio_charges ENABLE TRIGGER trg_folio_charges_prevent_delete;`);

    await prisma.$executeRawUnsafe(`ALTER TABLE payments DISABLE TRIGGER trg_payments_prevent_delete;`);
    await prisma.$executeRawUnsafe(`DELETE FROM payments WHERE folio_id IN (SELECT id FROM folios WHERE folio_number LIKE 'FOL-%');`);
    await prisma.$executeRawUnsafe(`ALTER TABLE payments ENABLE TRIGGER trg_payments_prevent_delete;`);

    await prisma.$executeRawUnsafe(`ALTER TABLE audit_logs DISABLE TRIGGER trg_audit_logs_append_only;`);
    await prisma.$executeRawUnsafe(`DELETE FROM audit_logs WHERE action IN ('INT_TEST_AUDIT', 'ORIGINAL_AUDIT_ENTRY', 'TAMPERED', 'TAMPERED_ENTRY');`);
    await prisma.$executeRawUnsafe(`ALTER TABLE audit_logs ENABLE TRIGGER trg_audit_logs_append_only;`);

    await prisma.$executeRawUnsafe(`DELETE FROM folios WHERE folio_number LIKE 'FOL-%';`);
    await prisma.$executeRawUnsafe(`DELETE FROM reservations WHERE confirmation_number LIKE 'CONF-%';`);
    await prisma.$executeRawUnsafe(`DELETE FROM guests WHERE phone = '+251911999888';`);
  } catch (err: any) {
    // ignore
  }
}

describe('Phase 1 Database Guarantees (PostgreSQL Enforced)', () => {
  let hotelId: string;
  let room101Id: string;
  let userId: string;
  let roomTypeId: string;

  beforeAll(async () => {
    await cleanupTestData();

    const hotel = await prisma.hotel.findFirst();
    const room101 = await prisma.room.findFirst({ where: { roomNumber: '101' } });
    const user = await prisma.user.findFirst();
    const roomType = await prisma.roomType.findFirst();

    if (!hotel || !room101 || !user || !roomType) {
      throw new Error('Database is not seeded. Run prisma:seed first.');
    }

    hotelId = hotel.id;
    room101Id = room101.id;
    userId = user.id;
    roomTypeId = roomType.id;
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  describe('1. Double-Booking Rejection', () => {
    const baseResId = 'int-res-101-base';
    const overlapResId = 'int-res-101-overlap';
    const b2bResId = 'int-res-101-b2b';

    it('should insert an active CONFIRMED reservation for Room 101 from 2026-12-10 to 2026-12-15', async () => {
      await prisma.$executeRawUnsafe(`
        INSERT INTO reservations (
          id, hotel_id, room_type_id, room_id, confirmation_number,
          check_in_date, check_out_date, adults, children,
          total_amount, status, source, created_by
        ) VALUES (
          '${baseResId}', '${hotelId}', '${roomTypeId}', '${room101Id}', 'CONF-INT-101-BASE',
          '2026-12-10', '2026-12-15', 1, 0,
          500.00, 'CONFIRMED', 'WALK_IN', '${userId}'
        );
      `);

      const res = await prisma.reservation.findUnique({ where: { id: baseResId } });
      expect(res).not.toBeNull();
      expect(res?.status).toBe('CONFIRMED');
    });

    it('should throw exclusion constraint violation (23P01) on overlapping booking from 2026-12-12 to 2026-12-14', async () => {
      let thrownError: any = null;
      try {
        await prisma.$executeRawUnsafe(`
          INSERT INTO reservations (
            id, hotel_id, room_type_id, room_id, confirmation_number,
            check_in_date, check_out_date, adults, children,
            total_amount, status, source, created_by
          ) VALUES (
            '${overlapResId}', '${hotelId}', '${roomTypeId}', '${room101Id}', 'CONF-INT-101-OVERLAP',
            '2026-12-12', '2026-12-14', 1, 0,
            200.00, 'CONFIRMED', 'WALK_IN', '${userId}'
          );
        `);
      } catch (err: any) {
        thrownError = err;
      }

      expect(thrownError).not.toBeNull();
      const isExclusionViolation =
        thrownError?.meta?.code === '23P01' ||
        thrownError.message.includes('23P01') ||
        thrownError.message.includes('no_overlapping_reservations');
      expect(isExclusionViolation).toBe(true);
    });

    it('should allow back-to-back booking from 2026-12-15 to 2026-12-18 without conflict', async () => {
      await expect(
        prisma.$executeRawUnsafe(`
          INSERT INTO reservations (
            id, hotel_id, room_type_id, room_id, confirmation_number,
            check_in_date, check_out_date, adults, children,
            total_amount, status, source, created_by
          ) VALUES (
            '${b2bResId}', '${hotelId}', '${roomTypeId}', '${room101Id}', 'CONF-INT-101-B2B',
            '2026-12-15', '2026-12-18', 1, 0,
            300.00, 'CONFIRMED', 'WALK_IN', '${userId}'
          );
        `)
      ).resolves.not.toThrow();
    });
  });

  describe('2. Date Check Rejection', () => {
    it('should reject check_out_date <= check_in_date with check constraint violation (23514)', async () => {
      let thrownError: any = null;
      try {
        await prisma.$executeRawUnsafe(`
          INSERT INTO reservations (
            id, hotel_id, room_type_id, room_id, confirmation_number,
            check_in_date, check_out_date, adults, children,
            total_amount, status, source, created_by
          ) VALUES (
            'int-res-invalid-dates', '${hotelId}', '${roomTypeId}', '${room101Id}', 'CONF-INT-INV-DATES',
            '2026-12-25', '2026-12-25', 1, 0,
            100.00, 'CONFIRMED', 'WALK_IN', '${userId}'
          );
        `);
      } catch (err: any) {
        thrownError = err;
      }

      expect(thrownError).not.toBeNull();
      const isCheckViolation =
        thrownError?.meta?.code === '23514' ||
        thrownError.message.includes('23514') ||
        thrownError.message.includes('check_out_after_check_in');
      expect(isCheckViolation).toBe(true);
    });
  });

  describe('3. Audit Log Immutability', () => {
    let auditLogId: string;

    beforeAll(async () => {
      const audit = await prisma.auditLog.create({
        data: {
          userId,
          action: 'INT_TEST_AUDIT',
          entityType: 'User',
          entityId: userId,
        },
      });
      auditLogId = audit.id;
    });

    it('should reject raw SQL UPDATE on audit_logs', async () => {
      let thrownError: any = null;
      try {
        await prisma.$executeRawUnsafe(`
          UPDATE audit_logs SET action = 'TAMPERED' WHERE id = '${auditLogId}';
        `);
      } catch (err: any) {
        thrownError = err;
      }

      expect(thrownError).not.toBeNull();
      expect(thrownError.message).toContain('audit_logs is append-only; updates and deletes are forbidden');
    });

    it('should reject raw SQL DELETE on audit_logs', async () => {
      let thrownError: any = null;
      try {
        await prisma.$executeRawUnsafe(`
          DELETE FROM audit_logs WHERE id = '${auditLogId}';
        `);
      } catch (err: any) {
        thrownError = err;
      }

      expect(thrownError).not.toBeNull();
      expect(thrownError.message).toContain('audit_logs is append-only; updates and deletes are forbidden');
    });
  });

  describe('4. Financial Row Protection', () => {
    let folioChargeId: string;
    let paymentId: string;

    beforeAll(async () => {
      const folio = await prisma.folio.create({
        data: {
          reservationId: 'int-res-101-base',
          folioNumber: 'FOL-INT-FINANCIAL-001',
        },
      });

      const charge = await prisma.folioCharge.create({
        data: {
          folioId: folio.id,
          chargeType: 'ROOM_RATE',
          description: 'Integration test room charge',
          amount: 150.00,
          quantity: 1,
          unitPrice: 150.00,
          postedBy: userId,
        },
      });
      folioChargeId = charge.id;

      const payment = await prisma.payment.create({
        data: {
          folioId: folio.id,
          reservationId: 'int-res-101-base',
          amount: 150.00,
          method: 'CASH',
          status: 'COMPLETED',
          processedBy: userId,
        },
      });
      paymentId = payment.id;
    });

    it('should block DELETE from folio_charges', async () => {
      let thrownError: any = null;
      try {
        await prisma.$executeRawUnsafe(`
          DELETE FROM folio_charges WHERE id = '${folioChargeId}';
        `);
      } catch (err: any) {
        thrownError = err;
      }

      expect(thrownError).not.toBeNull();
      expect(thrownError.message).toContain('Financial records cannot be deleted');
    });

    it('should block DELETE from payments', async () => {
      let thrownError: any = null;
      try {
        await prisma.$executeRawUnsafe(`
          DELETE FROM payments WHERE id = '${paymentId}';
        `);
      } catch (err: any) {
        thrownError = err;
      }

      expect(thrownError).not.toBeNull();
      expect(thrownError.message).toContain('Financial records cannot be deleted');
    });
  });
});
