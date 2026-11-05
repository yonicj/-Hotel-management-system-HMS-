import { prisma } from '../../config/database';
import { AppError } from '../../shared/utils/app-error';
import { calculateNights } from '@hms/shared-utils';
import { CreateRatePlanInput } from './rate-plans.schema';

export async function getRatePlans(hotelId: string) {
  return prisma.ratePlan.findMany({ where: { hotelId }, orderBy: { startDate: 'asc' } });
}

export async function createRatePlan(hotelId: string, input: CreateRatePlanInput) {
  return prisma.ratePlan.create({
    data: { ...input, hotelId, startDate: new Date(input.startDate), endDate: new Date(input.endDate) },
  });
}

export async function updateRatePlan(id: string, input: Partial<CreateRatePlanInput>) {
  const rp = await prisma.ratePlan.findUnique({ where: { id } });
  if (!rp) throw new AppError('Rate plan not found', 404);
  return prisma.ratePlan.update({ where: { id }, data: input as any });
}

export async function computeRate(roomTypeId: string, checkIn: string, checkOut: string) {
  const nights = calculateNights(checkIn, checkOut);
  const plan = await prisma.ratePlan.findFirst({
    where: {
      roomTypeId,
      isActive: true,
      startDate: { lte: new Date(checkIn) },
      endDate: { gte: new Date(checkOut) },
    },
    orderBy: { rate: 'asc' },
  });

  const roomType = await prisma.roomType.findUnique({ where: { id: roomTypeId } });
  if (!roomType) throw new AppError('Room type not found', 404);

  const rate = plan ? Number(plan.rate) : Number(roomType.baseRate);
  return { nights, ratePerNight: rate, totalAmount: rate * nights, ratePlan: plan };
}
