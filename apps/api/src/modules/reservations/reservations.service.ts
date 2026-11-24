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
import { CreateReservationInput, UpdateReservationInput } from './reservations.schema';

function handleReservationDbError(err: any): never {
  const errMsg = String(err?.message || '');
  const pgCode = err?.meta?.code || err?.code || '';
  if (
    pgCode === '23P01' ||
    errMsg.includes('23P01') ||
    errMsg.includes('no_overlapping_reservations') ||
    errMsg.includes('conflicting key value violates exclusion constraint')
  ) {
    throw new AppError(
      'Room is no longer available for the selected dates',
      409,
      ErrorCode.ROOM_UNAVAILABLE,
      err?.meta ?? null
    );
  }
  throw err;
}

export async function getReservations(
  hotelId: string,
  filters: Record<string, string>,
  rawPage: unknown,
  rawLimit: unknown
) {
  const { page, limit } = parsePaginationParams(rawPage, rawLimit, 200);
  const skip = getSkip(page, limit);

  const where: any = { hotelId };
  if (filters.status) where.status = filters.status;
  if (filters.date) {
    where.checkInDate = { lte: new Date(filters.date) };
    where.checkOutDate = { gte: new Date(filters.date) };
  }
  if (filters.startDate && filters.endDate) {
    where.checkInDate = { lt: new Date(filters.endDate) };
    where.checkOutDate = { gt: new Date(filters.startDate) };
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
  const checkIn = new Date(input.checkInDate);
  const checkOut = new Date(input.checkOutDate);

  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    throw new AppError(
      'Invalid check-in or check-out date format',
      400,
      ErrorCode.VALIDATION_ERROR
    );
  }

  if (checkOut <= checkIn) {
    throw new AppError(
      'Check-out date must be after check-in date',
      400,
      ErrorCode.VALIDATION_ERROR
    );
  }

  const reservation = await prisma.$transaction(async (tx) => {
    // 1. Compute rate within transaction
    const { nights, totalAmount, ratePlan } = await computeRate(
      input.roomTypeId,
      input.checkInDate,
      input.checkOutDate,
      tx
    );
    if (nights <= 0) {
      throw new AppError(
        'Check-out date must be after check-in date',
        400,
        ErrorCode.VALIDATION_ERROR
      );
    }
    const totalAmountDecimal = roundMoney(new Decimal(totalAmount));

    // 2. Validate guest exists
    const guest = await tx.guest.findUnique({ where: { id: input.guestId } });
    if (!guest) {
      throw new AppError('Guest not found', 404, ErrorCode.NOT_FOUND);
    }

    let assignedRoomId: string | null = null;

    // 3. Room assignment and availability verification
    if (input.roomId) {
      const room = await tx.room.findFirst({
        where: { id: input.roomId, hotelId },
        include: { roomType: true },
      });

      if (!room) {
        throw new AppError('Room not found', 404, ErrorCode.NOT_FOUND);
      }

      if (['MAINTENANCE', 'OUT_OF_SERVICE'].includes(room.status)) {
        throw new AppError(
          'The selected room is unavailable due to maintenance or service outage',
          409,
          ErrorCode.ROOM_UNAVAILABLE
        );
      }

      if (room.roomTypeId !== input.roomTypeId) {
        throw new AppError(
          'The selected room does not match the requested room type',
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      const overlapping = await tx.reservation.findFirst({
        where: {
          roomId: input.roomId,
          status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
          checkInDate: { lt: checkOut },
          checkOutDate: { gt: checkIn },
        },
      });

      if (overlapping) {
        throw new AppError(
          'Room is no longer available for the selected dates',
          409,
          ErrorCode.ROOM_UNAVAILABLE
        );
      }

      assignedRoomId = input.roomId;
    } else {
      // No specific roomId passed: check total sellable rooms vs active overlapping reservations
      const sellableRooms = await tx.room.findMany({
        where: {
          hotelId,
          roomTypeId: input.roomTypeId,
          status: { notIn: ['MAINTENANCE', 'OUT_OF_SERVICE'] },
        },
        select: { id: true },
      });

      if (sellableRooms.length === 0) {
        throw new AppError(
          'No operational rooms available for this room type',
          409,
          ErrorCode.ROOM_UNAVAILABLE
        );
      }

      const activeOverlappingCount = await tx.reservation.count({
        where: {
          hotelId,
          roomTypeId: input.roomTypeId,
          status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
          checkInDate: { lt: checkOut },
          checkOutDate: { gt: checkIn },
        },
      });

      if (activeOverlappingCount >= sellableRooms.length) {
        throw new AppError(
          'Room is no longer available for the selected dates',
          409,
          ErrorCode.ROOM_UNAVAILABLE
        );
      }

      // Auto-assign an available free room if one exists
      const freeRoom = await tx.room.findFirst({
        where: {
          hotelId,
          roomTypeId: input.roomTypeId,
          status: { notIn: ['MAINTENANCE', 'OUT_OF_SERVICE'] },
          reservations: {
            none: {
              status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
              checkInDate: { lt: checkOut },
              checkOutDate: { gt: checkIn },
            },
          },
        },
        select: { id: true },
      });

      assignedRoomId = freeRoom?.id ?? null;
    }

    const confirmationNumber = generateConfirmationNumber();

    try {
      const res = await tx.reservation.create({
        data: {
          confirmationNumber,
          hotelId,
          roomTypeId: input.roomTypeId,
          roomId: assignedRoomId,
          ratePlanId: input.ratePlanId || ratePlan?.id || null,
          checkInDate: checkIn,
          checkOutDate: checkOut,
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
            roomId: assignedRoomId,
            checkInDate: input.checkInDate,
            checkOutDate: input.checkOutDate,
            totalAmount: totalAmountDecimal.toString(),
          },
        },
        tx,
      });

      return res;
    } catch (err: any) {
      handleReservationDbError(err);
    }
  });

  return getReservationById(reservation.id);
}

export async function modifyReservation(
  id: string,
  input: UpdateReservationInput,
  userId: string
) {
  const reservation = await prisma.$transaction(async (tx) => {
    const existing = await tx.reservation.findUnique({
      where: { id },
      include: {
        room: true,
        roomType: true,
        reservationGuests: true,
      },
    });

    if (!existing) {
      throw new AppError('Reservation not found', 404, ErrorCode.NOT_FOUND);
    }

    // Enforce SRS state transitions
    if (['CANCELLED', 'COMPLETED'].includes(existing.status)) {
      throw new AppError(
        'Cannot modify a cancelled or completed reservation',
        400,
        ErrorCode.BAD_REQUEST
      );
    }

    if (input.status && input.status !== existing.status) {
      const ALLOWED_TRANSITIONS: Record<string, string[]> = {
        PENDING: ['CONFIRMED', 'CANCELLED', 'NO_SHOW'],
        CONFIRMED: ['CHECKED_IN', 'CANCELLED', 'NO_SHOW'],
        CHECKED_IN: ['COMPLETED'],
        COMPLETED: [],
        CANCELLED: [],
        NO_SHOW: [],
      };

      const allowed = ALLOWED_TRANSITIONS[existing.status] || [];
      if (!allowed.includes(input.status)) {
        throw new AppError(
          `Cannot transition reservation from ${existing.status} to ${input.status}`,
          400,
          ErrorCode.BAD_REQUEST
        );
      }
    }

    // Determine effective fields
    const effectiveCheckIn = input.checkInDate ? new Date(input.checkInDate) : existing.checkInDate;
    const effectiveCheckOut = input.checkOutDate ? new Date(input.checkOutDate) : existing.checkOutDate;
    const effectiveRoomTypeId = input.roomTypeId ?? existing.roomTypeId;
    const effectiveRoomId = input.roomId !== undefined ? input.roomId : existing.roomId;
    const effectiveStatus = input.status ?? existing.status;

    if (isNaN(effectiveCheckIn.getTime()) || isNaN(effectiveCheckOut.getTime())) {
      throw new AppError(
        'Invalid check-in or check-out date format',
        400,
        ErrorCode.VALIDATION_ERROR
      );
    }

    if (effectiveCheckOut <= effectiveCheckIn) {
      throw new AppError(
        'Check-out date must be after check-in date',
        400,
        ErrorCode.VALIDATION_ERROR
      );
    }

    // Verify room availability if reservation remains in active state
    if (['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(effectiveStatus)) {
      if (effectiveRoomId) {
        const room = await tx.room.findFirst({
          where: { id: effectiveRoomId, hotelId: existing.hotelId },
        });

        if (!room) {
          throw new AppError('Room not found', 404, ErrorCode.NOT_FOUND);
        }

        if (['MAINTENANCE', 'OUT_OF_SERVICE'].includes(room.status)) {
          throw new AppError(
            'The selected room is unavailable due to maintenance or service outage',
            409,
            ErrorCode.ROOM_UNAVAILABLE
          );
        }

        if (room.roomTypeId !== effectiveRoomTypeId) {
          throw new AppError(
            'The selected room does not match the requested room type',
            400,
            ErrorCode.VALIDATION_ERROR
          );
        }

        const overlapping = await tx.reservation.findFirst({
          where: {
            id: { not: id },
            roomId: effectiveRoomId,
            status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
            checkInDate: { lt: effectiveCheckOut },
            checkOutDate: { gt: effectiveCheckIn },
          },
        });

        if (overlapping) {
          throw new AppError(
            'Room is no longer available for the selected dates',
            409,
            ErrorCode.ROOM_UNAVAILABLE
          );
        }
      } else {
        // No specific roomId assigned: verify room type capacity
        const sellableRooms = await tx.room.findMany({
          where: {
            hotelId: existing.hotelId,
            roomTypeId: effectiveRoomTypeId,
            status: { notIn: ['MAINTENANCE', 'OUT_OF_SERVICE'] },
          },
          select: { id: true },
        });

        if (sellableRooms.length === 0) {
          throw new AppError(
            'No operational rooms available for this room type',
            409,
            ErrorCode.ROOM_UNAVAILABLE
          );
        }

        const activeOverlappingCount = await tx.reservation.count({
          where: {
            id: { not: id },
            hotelId: existing.hotelId,
            roomTypeId: effectiveRoomTypeId,
            status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
            checkInDate: { lt: effectiveCheckOut },
            checkOutDate: { gt: effectiveCheckIn },
          },
        });

        if (activeOverlappingCount >= sellableRooms.length) {
          throw new AppError(
            'Room is no longer available for the selected dates',
            409,
            ErrorCode.ROOM_UNAVAILABLE
          );
        }
      }
    }

    // Recalculate rate using Decimal arithmetic if dates or roomTypeId changed
    let newTotalAmount: any = existing.totalAmount;
    if (
      input.checkInDate ||
      input.checkOutDate ||
      input.roomTypeId ||
      input.ratePlanId !== undefined
    ) {
      const checkInStr = effectiveCheckIn.toISOString().split('T')[0];
      const checkOutStr = effectiveCheckOut.toISOString().split('T')[0];
      const { totalAmount } = await computeRate(
        effectiveRoomTypeId,
        checkInStr,
        checkOutStr,
        tx
      );
      newTotalAmount = new Decimal(totalAmount);
    }

    // Update guest if provided
    if (input.guestId) {
      const guest = await tx.guest.findUnique({ where: { id: input.guestId } });
      if (!guest) {
        throw new AppError('Guest not found', 404, ErrorCode.NOT_FOUND);
      }
      await tx.reservationGuest.deleteMany({ where: { reservationId: id } });
      await tx.reservationGuest.create({
        data: { reservationId: id, guestId: input.guestId, isPrimary: true },
      });
    }

    try {
      const updated = await tx.reservation.update({
        where: { id },
        data: {
          checkInDate: effectiveCheckIn,
          checkOutDate: effectiveCheckOut,
          roomTypeId: effectiveRoomTypeId,
          roomId: effectiveRoomId,
          ratePlanId: input.ratePlanId !== undefined ? input.ratePlanId : existing.ratePlanId,
          adults: input.adults !== undefined ? input.adults : existing.adults,
          children: input.children !== undefined ? input.children : existing.children,
          source: (input.source as any) !== undefined ? input.source : existing.source,
          specialRequests: input.specialRequests !== undefined ? input.specialRequests : existing.specialRequests,
          status: effectiveStatus as any,
          totalAmount: newTotalAmount,
        },
      });

      const auditAction =
        input.status && input.status !== existing.status
          ? input.status === 'CONFIRMED'
            ? AUDIT_ACTIONS.RESERVATION_CONFIRMED
            : input.status === 'CANCELLED'
            ? AUDIT_ACTIONS.RESERVATION_CANCELLED
            : input.status === 'NO_SHOW'
            ? AUDIT_ACTIONS.RESERVATION_NO_SHOW
            : input.status === 'COMPLETED'
            ? AUDIT_ACTIONS.RESERVATION_COMPLETED
            : AUDIT_ACTIONS.RESERVATION_UPDATED
          : AUDIT_ACTIONS.RESERVATION_UPDATED;

      await recordAuditLog({
        userId,
        action: auditAction,
        entityType: 'Reservation',
        entityId: id,
        changes: {
          before: {
            checkInDate: existing.checkInDate,
            checkOutDate: existing.checkOutDate,
            roomTypeId: existing.roomTypeId,
            roomId: existing.roomId,
            status: existing.status,
            totalAmount: existing.totalAmount.toString(),
            specialRequests: existing.specialRequests,
          },
          after: {
            checkInDate: effectiveCheckIn,
            checkOutDate: effectiveCheckOut,
            roomTypeId: effectiveRoomTypeId,
            roomId: effectiveRoomId,
            status: effectiveStatus,
            totalAmount: newTotalAmount.toString(),
            specialRequests: input.specialRequests !== undefined ? input.specialRequests : existing.specialRequests,
          },
        },
        tx,
      });

      return updated;
    } catch (err: any) {
      handleReservationDbError(err);
    }
  });

  return getReservationById(reservation.id);
}

export async function confirmReservation(id: string, userId?: string) {
  return prisma.$transaction(async (tx) => {
    const r = await tx.reservation.findUnique({
      where: { id },
    });
    if (!r) throw new AppError('Reservation not found', 404, ErrorCode.NOT_FOUND);

    if (r.status !== 'PENDING') {
      throw new AppError('Only pending reservations can be confirmed', 400, ErrorCode.BAD_REQUEST);
    }

    // Verify room availability if roomId is assigned
    if (r.roomId) {
      const room = await tx.room.findUnique({ where: { id: r.roomId } });
      if (!room || ['MAINTENANCE', 'OUT_OF_SERVICE'].includes(room.status)) {
        throw new AppError(
          'Assigned room is currently unavailable due to maintenance or service outage',
          409,
          ErrorCode.ROOM_UNAVAILABLE
        );
      }
      const overlapping = await tx.reservation.findFirst({
        where: {
          id: { not: id },
          roomId: r.roomId,
          status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
          checkInDate: { lt: r.checkOutDate },
          checkOutDate: { gt: r.checkInDate },
        },
      });
      if (overlapping) {
        throw new AppError(
          'Room is no longer available for the selected dates',
          409,
          ErrorCode.ROOM_UNAVAILABLE
        );
      }
    }

    const resolvedUserId = userId || r.createdBy;

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
  return prisma.$transaction(async (tx) => {
    const r = await tx.reservation.findUnique({
      where: { id },
    });
    if (!r) throw new AppError('Reservation not found', 404, ErrorCode.NOT_FOUND);

    if (['CHECKED_IN', 'COMPLETED'].includes(r.status)) {
      throw new AppError(
        'Cannot cancel an active or completed reservation',
        400,
        ErrorCode.BAD_REQUEST
      );
    }

    if (r.status === 'CANCELLED') {
      throw new AppError('Reservation is already cancelled', 400, ErrorCode.BAD_REQUEST);
    }

    const resolvedUserId = userId || r.createdBy;

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
  return prisma.$transaction(async (tx) => {
    const r = await tx.reservation.findUnique({
      where: { id: reservationId },
    });
    if (!r) throw new AppError('Reservation not found', 404, ErrorCode.NOT_FOUND);

    if (['CANCELLED', 'COMPLETED'].includes(r.status)) {
      throw new AppError(
        'Cannot assign a room to a cancelled or completed reservation',
        400,
        ErrorCode.BAD_REQUEST
      );
    }

    const room = await tx.room.findFirst({
      where: { id: roomId, hotelId: r.hotelId },
    });
    if (!room) {
      throw new AppError('Room not found', 404, ErrorCode.NOT_FOUND);
    }

    if (['MAINTENANCE', 'OUT_OF_SERVICE'].includes(room.status)) {
      throw new AppError(
        'The selected room is unavailable due to maintenance or service outage',
        409,
        ErrorCode.ROOM_UNAVAILABLE
      );
    }

    if (room.roomTypeId !== r.roomTypeId) {
      throw new AppError(
        'The selected room does not match the reservation room type',
        400,
        ErrorCode.VALIDATION_ERROR
      );
    }

    const overlapping = await tx.reservation.findFirst({
      where: {
        id: { not: reservationId },
        roomId,
        status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
        checkInDate: { lt: r.checkOutDate },
        checkOutDate: { gt: r.checkInDate },
      },
    });

    if (overlapping) {
      throw new AppError(
        'Room is no longer available for the selected dates',
        409,
        ErrorCode.ROOM_UNAVAILABLE
      );
    }

    const resolvedUserId = userId || r.createdBy;

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
