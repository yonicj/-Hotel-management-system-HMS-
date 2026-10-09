import { prisma } from '../../config/database';
import { AppError } from '../../shared/utils/app-error';
import { CreateGuestInput, UpdateGuestInput } from './guests.schema';
import { parsePaginationParams, buildPaginationMeta, getSkip } from '@hms/shared-utils';

export async function getGuests(search: string | undefined, rawPage: unknown, rawLimit: unknown) {
  const { page, limit } = parsePaginationParams(rawPage, rawLimit);
  const skip = getSkip(page, limit);

  const where = search
    ? {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search } },
        ],
      }
    : {};

  const [guests, total] = await Promise.all([
    prisma.guest.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.guest.count({ where }),
  ]);

  return { guests, pagination: buildPaginationMeta(page, limit, total) };
}

export async function getGuestById(id: string) {
  const guest = await prisma.guest.findUnique({ where: { id } });
  if (!guest) throw new AppError('Guest not found', 404);
  return guest;
}

export async function createGuest(input: CreateGuestInput) {
  const exists = await prisma.guest.findUnique({ where: { email: input.email } });
  if (exists) throw new AppError('Guest with this email already exists', 409);
  return prisma.guest.create({ data: input as any });
}

export async function updateGuest(id: string, input: UpdateGuestInput) {
  await getGuestById(id);
  return prisma.guest.update({ where: { id }, data: input as any });
}

export async function getGuestReservations(guestId: string) {
  await getGuestById(guestId);
  return prisma.reservation.findMany({
    where: { reservationGuests: { some: { guestId } } },
    include: { room: true, roomType: true },
    orderBy: { checkInDate: 'desc' },
  });
}
