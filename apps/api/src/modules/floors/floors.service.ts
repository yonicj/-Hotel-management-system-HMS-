import { prisma } from '../../config/database';
import { AppError } from '../../shared/utils/app-error';
import { ErrorCode } from '@ehms/types';

export async function getFloors(hotelId?: string) {
  const where = hotelId ? { hotelId } : {};
  return prisma.floor.findMany({
    where,
    include: { rooms: true },
    orderBy: { floorNumber: 'asc' },
  });
}

export async function getFloorById(id: string) {
  const floor = await prisma.floor.findUnique({
    where: { id },
    include: { rooms: true },
  });
  if (!floor) {
    throw new AppError('Floor not found', 404, ErrorCode.NOT_FOUND);
  }
  return floor;
}

export async function createFloor(data: {
  hotelId: string;
  floorNumber: number;
  name?: string;
  description?: string;
}) {
  return prisma.floor.create({
    data,
  });
}

export async function updateFloor(id: string, data: { name?: string; description?: string }) {
  await getFloorById(id);
  return prisma.floor.update({
    where: { id },
    data,
  });
}

export async function deleteFloor(id: string) {
  await getFloorById(id);
  return prisma.floor.delete({
    where: { id },
  });
}
