import { prisma } from '../../config/database';
import { AppError } from '../../shared/utils/app-error';
import { ErrorCode } from '@ehms/types';
import {
  generateConfirmationNumber,
  parsePaginationParams,
  buildPaginationMeta,
  getSkip,
  Decimal,
  roundMoney,
} from '@ehms/utils';
import { recordAuditLog, AUDIT_ACTIONS } from '../../shared/utils/audit';
import { computeRate } from '../rate-plans/rate-plans.service';
import { CreateReservationInput } from './reservations.schema';

export async function getReservations(
  hotelId: string,
  filters: Record<string, string>,
  rawPage: unknown,
  rawLimit: unknown
) {
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
      include: {
        room: true,
        roomType: true,
        reservationGuests: { include: { guest: true }, where: { isPrimary: true } },
      },
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
    include: {
      room: true,
      roomType: true,
      ratePlan: true,
      reservationGuests: { include: { guest: true } },
      folios: true,
    },
  });
  if (!r) throw new AppError('Reservation not found', 404, ErrorCode.NOT_FOUND);
  return r;
}

export async function createReservation(
  hotelId: string,
  input: CreateReservationInput,
  createdBy: string
) {
  const { nights, totalAmount } = await computeRate(
    input.roomTypeId,
    input.checkInDate,
    input.checkOutDate
  );
  if (nights <= 0) {
    throw new AppError(
      'Check-out date must be after check-in date',
      400,
      ErrorCode.VALIDATION_ERROR
    );
  }

  const confirmationNumber = generateConfirmationNumber();
  const totalAmountDecimal = roundMoney(new Decimal(totalAmount));

  const reservation = await prisma.$transaction(async (tx) => {
    const res = await tx.reservation.create({
      data: {
        confirmationNumber,
        hotelId,
        roomTypeId: input.roomTypeId,
        roomId: input.roomId,
        ratePlanId: input.ratePlanId,
        checkInDate: new Date(input.checkInDate),
        checkOutDate: new Date(input.checkOutDate),
        adults: input.adults ?? 1,
        children: input.children ?? 0,
        source: (input.source as any) ?? 'WALK_IN',
        specialRequests: input.specialRequests,
        totalAmount: totalAmountDecimal,
        createdBy,
        status: 'PENDING',
      },
    });

    await tx.reservationGuest.create({
      data: { reservationId: res.id, guestId: input.guestId, isPrimary: true },
    });

    await tx.folio.create({
      data: {
        reservationId: res.id,
        folioNumber: `FOL-${res.confirmationNumber}`,
        status: 'OPEN',
      },
    });

    await recordAuditLog({
      userId: createdBy,
      action: AUDIT_ACTIONS.RESERVATION_CREATED,
      entityType: 'Reservation',
      entityId: res.id,
      changes: {
        before: null,
        after: {
          confirmationNumber: res.confirmationNumber,
          status: 'PENDING',
          roomTypeId: input.roomTypeId,
          roomId: input.roomId,
          checkInDate: input.checkInDate,
          checkOutDate: input.checkOutDate,
          totalAmount: totalAmountDecimal.toString(),
        },
      },
      tx,
    });

    return res;
  });

  return getReservationById(reservation.id);
}

export async function confirmReservation(id: string, userId?: string) {
  const r = await getReservationById(id);
  if (r.status !== 'PENDING') {
    throw new AppError('Only pending reservations can be confirmed', 400, ErrorCode.BAD_REQUEST);
  }
  const resolvedUserId = userId || r.createdBy;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.reservation.update({
      where: { id },
      data: { status: 'CONFIRMED' },
    });

    await recordAuditLog({
      userId: resolvedUserId,
      action: AUDIT_ACTIONS.RESERVATION_CONFIRMED,
      entityType: 'Reservation',
      entityId: id,
      changes: {
        before: { status: r.status },
        after: { status: 'CONFIRMED' },
      },
      tx,
    });

    return updated;
  });
}

export async function cancelReservation(id: string, userId?: string) {
  const r = await getReservationById(id);
  if (['CHECKED_IN', 'COMPLETED'].includes(r.status)) {
    throw new AppError(
      'Cannot cancel an active or completed reservation',
      400,
      ErrorCode.BAD_REQUEST
    );
  }
  const resolvedUserId = userId || r.createdBy;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.reservation.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await recordAuditLog({
      userId: resolvedUserId,
      action: AUDIT_ACTIONS.RESERVATION_CANCELLED,
      entityType: 'Reservation',
      entityId: id,
      changes: {
        before: { status: r.status },
        after: { status: 'CANCELLED' },
      },
      tx,
    });

    return updated;
  });
}

export async function assignRoom(reservationId: string, roomId: string, userId?: string) {
  const r = await getReservationById(reservationId);
  const resolvedUserId = userId || r.createdBy;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.reservation.update({
      where: { id: reservationId },
      data: { roomId },
    });

    await recordAuditLog({
      userId: resolvedUserId,
      action: AUDIT_ACTIONS.ROOM_ASSIGNED,
      entityType: 'Reservation',
      entityId: reservationId,
      changes: {
        before: { roomId: r.roomId },
        after: { roomId },
      },
      tx,
    });

    return updated;
  });
}
