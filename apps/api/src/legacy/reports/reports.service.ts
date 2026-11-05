import { prisma } from '../../config/database';

export async function getOccupancyReport(hotelId: string, from: string, to: string) {
  const totalRooms = await prisma.room.count({ where: { hotelId } });
  const audits = await prisma.nightAuditLog.findMany({
    where: { hotelId, auditDate: { gte: new Date(from), lte: new Date(to) }, status: 'COMPLETED' },
    orderBy: { auditDate: 'asc' },
  });

  return audits.map((a) => ({
    date: a.auditDate,
    roomsOccupied: a.totalRoomsOccupied,
    totalRooms,
    occupancyRate: totalRooms > 0 ? Math.round((a.totalRoomsOccupied / totalRooms) * 100) : 0,
  }));
}

export async function getRevenueReport(hotelId: string, from: string, to: string) {
  const audits = await prisma.nightAuditLog.findMany({
    where: { hotelId, auditDate: { gte: new Date(from), lte: new Date(to) }, status: 'COMPLETED' },
    orderBy: { auditDate: 'asc' },
  });

  const totalRevenue = audits.reduce((sum, a) => sum + Number(a.totalRevenue), 0);
  return { totalRevenue, breakdown: audits.map((a) => ({ date: a.auditDate, revenue: Number(a.totalRevenue) })) };
}

export async function getArrivalsDeparturesReport(hotelId: string, date: string) {
  const [arrivals, departures] = await Promise.all([
    prisma.reservation.count({ where: { hotelId, checkInDate: new Date(date), status: { in: ['CONFIRMED', 'CHECKED_IN'] } } }),
    prisma.reservation.count({ where: { hotelId, checkOutDate: new Date(date), status: { in: ['CHECKED_IN', 'CHECKED_OUT'] } } }),
  ]);
  return { date, arrivals, departures };
}

export async function getHousekeepingSummary(hotelId: string, date: string) {
  const tasks = await prisma.housekeepingTask.groupBy({
    by: ['status'],
    where: { room: { hotelId }, scheduledDate: new Date(date) },
    _count: { status: true },
  });
  return tasks.map((t) => ({ status: t.status, count: t._count.status }));
}

export async function getGuestLedger(hotelId: string) {
  return prisma.folio.findMany({
    where: { reservation: { hotelId }, status: 'OPEN' },
    include: {
      reservation: { include: { reservationGuests: { include: { guest: true }, where: { isPrimary: true } }, room: true } },
      charges: true,
      payments: true,
    },
  });
}
