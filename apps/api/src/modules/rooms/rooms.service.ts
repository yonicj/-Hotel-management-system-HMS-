import { prisma } from '../../config/database';
import { AppError } from '../../shared/utils/app-error';
import { emitRoomStatusUpdated } from '../../shared/events/room-status.events';
import { CreateRoomInput, UpdateRoomStatusInput } from './rooms.schema';

export async function getRooms(hotelId: string) {
  return prisma.room.findMany({
    where: { hotelId },
    include: { roomType: true },
    orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
  });
}

export async function getRoomAvailability(hotelId: string, checkIn: string, checkOut: string, roomTypeId?: string) {
  const where: any = { hotelId, status: 'AVAILABLE' };
  if (roomTypeId) where.roomTypeId = roomTypeId;

  // Exclude rooms with overlapping confirmed/checked-in reservations
  where.reservations = {
    none: {
      status: { in: ['CONFIRMED', 'CHECKED_IN'] },
      checkInDate: { lt: new Date(checkOut) },
      checkOutDate: { gt: new Date(checkIn) },
    },
  };

  return prisma.room.findMany({ where, include: { roomType: true } });
}

export async function getRoomById(id: string) {
  const room = await prisma.room.findUnique({ where: { id }, include: { roomType: true } });
  if (!room) throw new AppError('Room not found', 404);
  return room;
}

export async function createRoom(hotelId: string, input: CreateRoomInput) {
  return prisma.room.create({ data: { ...input, hotelId }, include: { roomType: true } });
}

export async function updateRoomStatus(id: string, input: UpdateRoomStatusInput, updatedBy: string, hotelId: string) {
  const room = await getRoomById(id);
  const updated = await prisma.room.update({
    where: { id },
    data: { status: input.status as any, notes: input.notes },
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
