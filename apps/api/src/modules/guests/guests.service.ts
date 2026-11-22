import { prisma } from '../../config/database';
import { AppError } from '../../shared/utils/app-error';
import { ErrorCode } from '@ehms/types';
import { CreateGuestInput, UpdateGuestInput } from './guests.schema';
import { parsePaginationParams, buildPaginationMeta, getSkip } from '@ehms/utils';

export async function getGuests(search: string | undefined, rawPage: unknown, rawLimit: unknown) {
  const { page, limit } = parsePaginationParams(rawPage, rawLimit);
  const skip = getSkip(page, limit);

  const where: any = search
    ? {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
          { idNumber: { contains: search, mode: 'insensitive' } },
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
  const guest = await prisma.guest.findUnique({
    where: { id },
    include: {
      reservationGuests: {
        include: {
          reservation: {
            include: {
              room: true,
              roomType: true,
            },
          },
        },
      },
    },
  });
  if (!guest) throw new AppError('Guest not found', 404, ErrorCode.NOT_FOUND);
  return guest;
}

export async function createGuest(input: CreateGuestInput) {
  const email = input.email?.trim() || null;
  if (email) {
    const exists = await prisma.guest.findUnique({ where: { email } });
    if (exists) throw new AppError('Guest with this email already exists', 409, ErrorCode.CONFLICT);
  }
  const data: any = {
    ...input,
    email,
    dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
  };
  return prisma.guest.create({ data });
}

export async function updateGuest(id: string, input: UpdateGuestInput) {
  const current = await getGuestById(id);
  const email = input.email !== undefined ? (input.email?.trim() || null) : undefined;
  if (email && email !== current.email) {
    const exists = await prisma.guest.findUnique({ where: { email } });
    if (exists) throw new AppError('Guest with this email already exists', 409, ErrorCode.CONFLICT);
  }
  const data: any = { ...input };
  if (email !== undefined) {
    data.email = email;
  }
  if (input.dateOfBirth !== undefined) {
    data.dateOfBirth = input.dateOfBirth ? new Date(input.dateOfBirth) : null;
  }
  return prisma.guest.update({ where: { id }, data });
}

export async function getGuestReservations(guestId: string) {
  await getGuestById(guestId);
  return prisma.reservation.findMany({
    where: { reservationGuests: { some: { guestId } } },
    include: { room: true, roomType: true },
    orderBy: { checkInDate: 'desc' },
  });
}
