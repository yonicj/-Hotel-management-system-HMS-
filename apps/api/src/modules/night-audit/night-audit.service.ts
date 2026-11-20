import { prisma } from '../../config/database';
import { AppError } from '../../shared/utils/app-error';
import { ErrorCode } from '@ehms/types';
import { today, Decimal, roundMoney } from '@ehms/utils';
import { recordAuditLog, AUDIT_ACTIONS } from '../../shared/utils/audit';

export async function getNightAuditStatus(hotelId: string) {
  const auditDate = today();
  return prisma.nightAuditLog.findFirst({
    where: { hotelId, auditDate: new Date(auditDate) },
  });
}

export async function runNightAudit(hotelId: string, userId: string) {
  const auditDate = today();

  const existing = await prisma.nightAuditLog.findFirst({
    where: { hotelId, auditDate: new Date(auditDate) },
  });
  if (existing?.status === 'COMPLETED') {
    throw new AppError('Night audit already completed for today', 400, ErrorCode.BAD_REQUEST);
  }

  return prisma.$transaction(async (tx) => {
    const auditLog = await tx.nightAuditLog.upsert({
      where: { hotelId_auditDate: { hotelId, auditDate: new Date(auditDate) } },
      create: { hotelId, auditDate: new Date(auditDate), status: 'RUNNING', runBy: userId },
      update: { status: 'RUNNING', runBy: userId },
    });

    // 1. Post room rates for all checked-in reservations
    const checkedIn = await tx.reservation.findMany({
      where: { hotelId, status: 'CHECKED_IN' },
      include: { folios: { where: { status: 'OPEN' } }, ratePlan: true, roomType: true },
    });

    for (const res of checkedIn) {
      const folio = res.folios[0];
      if (!folio) continue;
      const rateDecimal = new Decimal(
        res.ratePlan ? res.ratePlan.rate.toString() : res.roomType.baseRate.toString()
      );
      const rate = roundMoney(rateDecimal);

      const charge = await tx.folioCharge.create({
        data: {
          folioId: folio.id,
          chargeType: 'ROOM_RATE',
          description: `Room charge - ${auditDate}`,
          quantity: 1,
          unitPrice: rate,
          amount: rate,
          postedBy: userId,
        },
      });

      await recordAuditLog({
        userId,
        action: AUDIT_ACTIONS.FOLIO_CHARGE_POSTED,
        entityType: 'FolioCharge',
        entityId: charge.id,
        changes: {
          folioId: folio.id,
          chargeType: 'ROOM_RATE',
          amount: rate.toString(),
          description: `Room charge - ${auditDate}`,
        },
        tx,
      });
    }

    // 2. Mark no-shows and capture transitions in audit log
    const noShowReservations = await tx.reservation.findMany({
      where: { hotelId, status: 'CONFIRMED', checkInDate: { lt: new Date() } },
    });

    for (const res of noShowReservations) {
      await tx.reservation.update({
        where: { id: res.id },
        data: { status: 'NO_SHOW' },
      });

      await recordAuditLog({
        userId,
        action: AUDIT_ACTIONS.RESERVATION_NO_SHOW,
        entityType: 'Reservation',
        entityId: res.id,
        changes: {
          before: { status: 'CONFIRMED' },
          after: { status: 'NO_SHOW' },
        },
        tx,
      });
    }

    // 3. Compute totals using exact Decimal arithmetic
    const totalOccupied = checkedIn.length;
    const totalRevenueDecimal = checkedIn.reduce((sum, r) => {
      const rate = new Decimal(
        r.ratePlan ? r.ratePlan.rate.toString() : r.roomType.baseRate.toString()
      );
      return sum.plus(rate);
    }, new Decimal(0));

    const completed = await tx.nightAuditLog.update({
      where: { id: auditLog.id },
      data: {
        status: 'COMPLETED',
        totalRoomsOccupied: totalOccupied,
        totalRevenue: roundMoney(totalRevenueDecimal),
        completedAt: new Date(),
      },
    });

    await recordAuditLog({
      userId,
      action: AUDIT_ACTIONS.NIGHT_AUDIT_COMPLETED,
      entityType: 'NightAuditLog',
      entityId: completed.id,
      changes: {
        auditDate,
        totalRoomsOccupied: totalOccupied,
        totalRevenue: roundMoney(totalRevenueDecimal).toString(),
      },
      tx,
    });

    return completed;
  });
}

export async function getNightAuditHistory(hotelId: string) {
  return prisma.nightAuditLog.findMany({
    where: { hotelId },
    orderBy: { auditDate: 'desc' },
    take: 30,
  });
}
