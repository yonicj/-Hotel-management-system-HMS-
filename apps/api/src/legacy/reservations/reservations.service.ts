import { prisma } from '../../config/database';
import { AppError } from '../../shared/utils/app-error';
import { generateConfirmationNumber } from '@hms/shared-utils';
import { computeRate } from '../rate-plans/rate-plans.service';
import { CreateReservationInput } from './reservations.schema';
import { parsePaginationParams, buildPaginationMeta, getSkip } from '@hms/shared-utils';

export async function getReservations(hotelId: string, filters: Record<string, string>, rawPage: unknown, rawLimit: unknown) {
  const { page, limit } = parsePaginationParams(rawPage, rawLimit);
  const skip = getSkip(page, limit);

  const where: any = { hotelId };
  if (filters.status) where.status = filters.status;
  if (filters.date) {
    where.checkInDate = { lte: new Date(filters.date) };
    where.checkOutDate = { gte: new Date(filters.date) };
  }

  const [reservations, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      include: { room: true, roomType: true, reservationGuests: { include: { guest: true }, where: { isPrimary: true } } },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.reservation.count({ where }),
  ]);

  return { reservations, pagination: buildPaginationMeta(page, limit, total) };
}

export async function getReservationById(id: string) {
  const r = await prisma.reservation.findUnique({
    where: { id },
    include: { room: true, roomType: true, ratePlan: true, reservationGuests: { include: { guest: true } }, folios: true },
  });
  if (!r) throw new AppError('Reservation not found', 404);
  return r;
}

export async function createReservation(hotelId: string, input: CreateReservationInput, createdBy: string) {
  const { nights, totalAmount } = await computeRate(input.roomTypeId, input.checkInDate, input.checkOutDate);
  if (nights <= 0) throw new AppError('Check-out date must be after check-in date', 400);

  const confirmationNumber = generateConfirmationNumber();

  const reservation = await prisma.$transaction(async (tx) => {
    const res = await tx.reservation.create({
      data: {
        confirmationNumber,
        hotelId,
        guestId: undefined,
        roomTypeId: input.roomTypeId,
        roomId: input.roomId,
        ratePlanId: input.ratePlanId,
        checkInDate: new Date(input.checkInDate),
        checkOutDate: new Date(input.checkOutDate),
        adults: input.adults ?? 1,
        children: input.children ?? 0,
        source: (input.source as any) ?? 'WALK_IN',
        specialRequests: input.specialRequests,
        totalAmount,
        createdBy,
        status: 'PENDING',
      } as any,
    });

    await tx.reservationGuest.create({
      data: { reservationId: res.id, guestId: input.guestId, isPrimary: true },
    });

    // Create open folio
    await tx.folio.create({
      data: {
        reservationId: res.id,
        folioNumber: `FOL-${res.confirmationNumber}`,
        status: 'OPEN',
      },
    });

    return res;
  });

  return getReservationById(reservation.id);
}

export async function confirmReservation(id: string) {
  const r = await getReservationById(id);
  if (r.status !== 'PENDING') throw new AppError('Only pending reservations can be confirmed', 400);
  return prisma.reservation.update({ where: { id }, data: { status: 'CONFIRMED' } });
}

export async function cancelReservation(id: string) {
  const r = await getReservationById(id);
  if (['CHECKED_IN', 'CHECKED_OUT'].includes(r.status)) throw new AppError('Cannot cancel an active or completed reservation', 400);
  return prisma.reservation.update({ where: { id }, data: { status: 'CANCELLED' } });
}

export async function assignRoom(reservationId: string, roomId: string) {
  await getReservationById(reservationId);
  return prisma.reservation.update({ where: { id: reservationId }, data: { roomId } });
}
