import { prisma } from '../../config/database';
import { AppError } from '../../shared/utils/app-error';
import { CreateRoomTypeInput, UpdateRoomTypeInput } from './room-types.schema';

export async function getRoomTypes(hotelId: string) {
  return prisma.roomType.findMany({ where: { hotelId }, orderBy: { name: 'asc' } });
}

export async function getRoomTypeById(id: string) {
  const rt = await prisma.roomType.findUnique({ where: { id } });
  if (!rt) throw new AppError('Room type not found', 404);
  return rt;
}

export async function createRoomType(hotelId: string, input: CreateRoomTypeInput) {
  return prisma.roomType.create({ data: { ...input, hotelId, amenities: input.amenities ?? [] } });
}

export async function updateRoomType(id: string, input: UpdateRoomTypeInput) {
  await getRoomTypeById(id);
  return prisma.roomType.update({ where: { id }, data: input as any });
}

export async function deleteRoomType(id: string) {
  await getRoomTypeById(id);
  await prisma.roomType.delete({ where: { id } });
}
