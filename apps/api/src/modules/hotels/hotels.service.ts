import { prisma } from '../../config/database';
import { AppError } from '../../shared/utils/app-error';
import { ErrorCode } from '@ehms/types';

export async function getHotels() {
  return prisma.hotel.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function getHotelById(id: string) {
  const hotel = await prisma.hotel.findUnique({
    where: { id },
  });
  if (!hotel) {
    throw new AppError('Hotel not found', 404, ErrorCode.NOT_FOUND);
  }
  return hotel;
}

export async function updateHotel(
  id: string,
  data: {
    name?: string;
    address?: string;
    city?: string;
    country?: string;
    phone?: string;
    email?: string;
    timezone?: string;
  }
) {
  await getHotelById(id);
  return prisma.hotel.update({
    where: { id },
    data,
  });
}
