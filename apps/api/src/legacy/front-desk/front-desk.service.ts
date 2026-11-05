import { prisma } from '../../config/database';
import { AppError } from '../../shared/utils/app-error';
import { emitReservationCheckedIn, emitReservationCheckedOut } from '../../shared/events/reservation.events';
import { emitRoomStatusUpdated } from '../../shared/events/room-status.events';

export async function checkIn(reservationId: string, userId: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { room: true, reservationGuests: { include: { guest: true }, where: { isPrimary: true } } },
  });

  if (!reservation) throw new AppError('Reservation not found', 404);
  if (reservation.status !== 'CONFIRMED' && reservation.status !== 'PENDING') {
    throw new AppError('Reservation is not in a check-in eligible status', 400);
  }
  if (!reservation.roomId) throw new AppError('No room assigned to this reservation', 400);

  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.reservation.update({
      where: { id: reservationId },
      data: { status: 'CHECKED_IN', actualCheckIn: new Date() },
    });
    await tx.room.update({ where: { id: reservation.roomId! }, data: { status: 'OCCUPIED' } });
    return res;
  });

  const primaryGuest = reservation.reservationGuests[0]?.guest;
  emitReservationCheckedIn(reservation.hotelId, {
    reservationId,
    confirmationNumber: reservation.confirmationNumber,
    roomId: reservation.roomId,
    roomNumber: reservation.room!.roomNumber,
    guestName: primaryGuest ? `${primaryGuest.firstName} ${primaryGuest.lastName}` : 'Guest',
  });
  emitRoomStatusUpdated(reservation.hotelId, {
    roomId: reservation.roomId,
    roomNumber: reservation.room!.roomNumber,
    status: 'occupied' as any,
    updatedBy: userId,
    updatedAt: new Date().toISOString(),
  });

  return updated;
}

export async function checkOut(reservationId: string, userId: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { room: true, folios: { include: { charges: true, payments: true } } },
  });

  if (!reservation) throw new AppError('Reservation not found', 404);
  if (reservation.status !== 'CHECKED_IN') throw new AppError('Reservation is not checked in', 400);

  const openFolio = reservation.folios.find((f) => f.status === 'OPEN');
  if (openFolio) {
    const totalCharges = openFolio.charges.reduce((sum, c) => sum + Number(c.amount), 0);
    const totalPayments = openFolio.payments.filter((p) => p.status === 'COMPLETED').reduce((sum, p) => sum + Number(p.amount), 0);
    if (totalPayments < totalCharges) throw new AppError(`Outstanding balance: ${totalCharges - totalPayments}. Please settle the folio before check-out.`, 400);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.reservation.update({
      where: { id: reservationId },
      data: { status: 'CHECKED_OUT', actualCheckOut: new Date() },
    });
    await tx.room.update({ where: { id: reservation.roomId! }, data: { status: 'DIRTY' } });
    if (openFolio) await tx.folio.update({ where: { id: openFolio.id }, data: { status: 'CLOSED' } });
    return res;
  });

  emitReservationCheckedOut(reservation.hotelId, {
    reservationId,
    confirmationNumber: reservation.confirmationNumber,
    roomId: reservation.roomId!,
    roomNumber: reservation.room!.roomNumber,
  });
  emitRoomStatusUpdated(reservation.hotelId, {
    roomId: reservation.roomId!,
    roomNumber: reservation.room!.roomNumber,
    status: 'dirty' as any,
    updatedBy: userId,
    updatedAt: new Date().toISOString(),
  });

  return updated;
}

export async function getArrivals(hotelId: string, date: string) {
  return prisma.reservation.findMany({
    where: { hotelId, checkInDate: new Date(date), status: { in: ['CONFIRMED', 'PENDING'] } },
    include: { room: true, roomType: true, reservationGuests: { include: { guest: true }, where: { isPrimary: true } } },
    orderBy: { checkInDate: 'asc' },
  });
}

export async function getDepartures(hotelId: string, date: string) {
  return prisma.reservation.findMany({
    where: { hotelId, checkOutDate: new Date(date), status: 'CHECKED_IN' },
    include: { room: true, roomType: true, reservationGuests: { include: { guest: true }, where: { isPrimary: true } } },
    orderBy: { checkOutDate: 'asc' },
  });
}

export async function getInHouse(hotelId: string) {
  return prisma.reservation.findMany({
    where: { hotelId, status: 'CHECKED_IN' },
    include: { room: true, roomType: true, reservationGuests: { include: { guest: true }, where: { isPrimary: true } } },
  });
}

export async function getRoomRack(hotelId: string) {
  return prisma.room.findMany({
    where: { hotelId },
    include: {
      roomType: true,
      reservations: {
        where: { status: { in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'] } },
        include: { reservationGuests: { include: { guest: true }, where: { isPrimary: true } } },
        take: 1,
      },
    },
    orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
  });
}
