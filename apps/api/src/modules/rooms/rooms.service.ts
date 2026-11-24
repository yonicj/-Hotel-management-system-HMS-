import { prisma } from '../../config/database';
import { AppError } from '../../shared/utils/app-error';
import { ErrorCode } from '@ehms/types';
import { emitRoomStatusUpdated } from '../../shared/events/room-status.events';
import { recordAuditLog, AUDIT_ACTIONS } from '../../shared/utils/audit';
import { CreateRoomInput, UpdateRoomStatusInput } from './rooms.schema';

export async function getRooms(hotelId: string) {
  return prisma.room.findMany({
    where: { hotelId },
    include: { roomType: true, floor: true },
    orderBy: [{ floor: { floorNumber: 'asc' } }, { roomNumber: 'asc' }],
  });
}

export async function getRoomAvailability(
  hotelId: string,
  checkIn: string,
  checkOut: string,
  roomTypeId?: string
) {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
    throw new AppError(
      'Invalid check-in or check-out date format',
      400,
      ErrorCode.VALIDATION_ERROR
    );
  }

  if (checkOutDate <= checkInDate) {
    throw new AppError(
      'Check-out date must be after check-in date',
      400,
      ErrorCode.VALIDATION_ERROR
    );
  }

  const where: any = {
    hotelId,
    status: {
      notIn: ['MAINTENANCE', 'OUT_OF_SERVICE'],
    },
  };

  if (roomTypeId) {
    where.roomTypeId = roomTypeId;
  }

  where.reservations = {
    none: {
      status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
      checkInDate: { lt: checkOutDate },
      checkOutDate: { gt: checkInDate },
    },
  };

  return prisma.room.findMany({
    where,
    include: { roomType: true, floor: true },
    orderBy: [{ floor: { floorNumber: 'asc' } }, { roomNumber: 'asc' }],
  });
}

export async function getRoomById(id: string) {
  const room = await prisma.room.findUnique({
    where: { id },
    include: { roomType: true, floor: true },
  });
  if (!room) throw new AppError('Room not found', 404);
  return room;
}

export async function createRoom(hotelId: string, input: CreateRoomInput, createdBy?: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.room.findFirst({
      where: { hotelId, roomNumber: input.roomNumber },
    });
    if (existing) {
      throw new AppError(
        `Room number ${input.roomNumber} already exists in this hotel`,
        409,
        ErrorCode.CONFLICT
      );
    }

    const room = await tx.room.create({
      data: { ...input, hotelId } as any,
      include: { roomType: true, floor: true },
    });

    if (createdBy) {
      await recordAuditLog({
        userId: createdBy,
        action: AUDIT_ACTIONS.ROOM_CREATED,
        entityType: 'Room',
        entityId: room.id,
        changes: {
          roomNumber: room.roomNumber,
          roomTypeId: room.roomTypeId,
          floorId: room.floorId,
          status: room.status,
        },
        tx,
      });
    }

    return room;
  });
}

export async function updateRoomStatus(
  id: string,
  input: UpdateRoomStatusInput,
  updatedBy: string,
  hotelId: string
) {
  const room = await getRoomById(id);

  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.room.update({
      where: { id },
      data: { status: input.status as any, notes: input.notes },
    });

    await recordAuditLog({
      userId: updatedBy,
      action: AUDIT_ACTIONS.ROOM_STATUS_UPDATED,
      entityType: 'Room',
      entityId: id,
      changes: {
        before: { status: room.status, notes: room.notes },
        after: { status: input.status, notes: input.notes },
      },
      tx,
    });

    return res;
  });

  emitRoomStatusUpdated(hotelId, {
    roomId: id,
    roomNumber: room.roomNumber,
    status: input.status,
    updatedBy,
    updatedAt: new Date().toISOString(),
  });

  return updated;
}
