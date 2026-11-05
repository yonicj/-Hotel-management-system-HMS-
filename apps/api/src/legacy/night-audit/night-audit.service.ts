import { prisma } from '../../config/database';
import { AppError } from '../../shared/utils/app-error';
import { getIO } from '../../config/socket';
import { SOCKET_EVENTS } from '@hms/shared-types';
import { today } from '@hms/shared-utils';

export async function getNightAuditStatus(hotelId: string) {
  const auditDate = today();
  return prisma.nightAuditLog.findFirst({ where: { hotelId, auditDate: new Date(auditDate) } });
}

export async function runNightAudit(hotelId: string, userId: string) {
  const auditDate = today();

  const existing = await prisma.nightAuditLog.findFirst({
    where: { hotelId, auditDate: new Date(auditDate) },
  });
  if (existing?.status === 'COMPLETED') throw new AppError('Night audit already completed for today', 400);

  const auditLog = await prisma.nightAuditLog.upsert({
    where: { hotelId_auditDate: { hotelId, auditDate: new Date(auditDate) } },
    create: { hotelId, auditDate: new Date(auditDate), status: 'RUNNING', runBy: userId },
    update: { status: 'RUNNING', runBy: userId },
  });

  const io = getIO();
  io.to(`hotel:${hotelId}`).emit(SOCKET_EVENTS.NIGHT_AUDIT_PROGRESS, { status: 'running', step: 'Starting audit', progress: 0 });

  // 1. Post room rates for all checked-in reservations
  const checkedIn = await prisma.reservation.findMany({
    where: { hotelId, status: 'CHECKED_IN' },
    include: { folios: { where: { status: 'OPEN' } }, ratePlan: true, roomType: true },
  });

  io.to(`hotel:${hotelId}`).emit(SOCKET_EVENTS.NIGHT_AUDIT_PROGRESS, { status: 'running', step: 'Posting room rates', progress: 30 });

  for (const res of checkedIn) {
    const folio = res.folios[0];
    if (!folio) continue;
    const rate = res.ratePlan ? Number(res.ratePlan.rate) : Number(res.roomType.baseRate);
    await prisma.folioCharge.create({
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
  }

  // 2. Mark no-shows
  io.to(`hotel:${hotelId}`).emit(SOCKET_EVENTS.NIGHT_AUDIT_PROGRESS, { status: 'running', step: 'Processing no-shows', progress: 60 });

  await prisma.reservation.updateMany({
    where: { hotelId, status: 'CONFIRMED', checkInDate: { lt: new Date() } },
    data: { status: 'NO_SHOW' },
  });

  // 3. Compute totals
  const totalOccupied = checkedIn.length;
  const totalRevenue = checkedIn.reduce((sum, r) => {
    const rate = r.ratePlan ? Number(r.ratePlan.rate) : Number(r.roomType.baseRate);
    return sum + rate;
  }, 0);

  const completed = await prisma.nightAuditLog.update({
    where: { id: auditLog.id },
    data: { status: 'COMPLETED', totalRoomsOccupied: totalOccupied, totalRevenue, completedAt: new Date() },
  });

  io.to(`hotel:${hotelId}`).emit(SOCKET_EVENTS.NIGHT_AUDIT_PROGRESS, { status: 'completed', progress: 100 });

  return completed;
}

export async function getNightAuditHistory(hotelId: string) {
  return prisma.nightAuditLog.findMany({
    where: { hotelId },
    orderBy: { auditDate: 'desc' },
    take: 30,
  });
}
