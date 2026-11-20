import { prisma } from '../../config/database';
import { AppError } from '../../shared/utils/app-error';
import { ErrorCode } from '@ehms/types';
import { calculateNights, Decimal, roundMoney } from '@ehms/utils';
import { CreateRatePlanInput } from './rate-plans.schema';

export async function getRatePlans(hotelId: string) {
  return prisma.ratePlan.findMany({ where: { hotelId }, orderBy: { startDate: 'asc' } });
}

export async function createRatePlan(hotelId: string, input: CreateRatePlanInput) {
  return prisma.ratePlan.create({
    data: {
      ...input,
      hotelId,
      rate: roundMoney(new Decimal(input.rate)),
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
    } as any,
  });
}

export async function updateRatePlan(id: string, input: Partial<CreateRatePlanInput>) {
  const rp = await prisma.ratePlan.findUnique({ where: { id } });
  if (!rp) throw new AppError('Rate plan not found', 404, ErrorCode.NOT_FOUND);
  const data: any = { ...input };
  if (input.rate !== undefined) {
    data.rate = roundMoney(new Decimal(input.rate));
  }
  return prisma.ratePlan.update({ where: { id }, data });
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
  if (!roomType) throw new AppError('Room type not found', 404, ErrorCode.NOT_FOUND);

  const ratePerNightDecimal = new Decimal(plan ? plan.rate.toString() : roomType.baseRate.toString());
  const nightsDecimal = new Decimal(Math.max(0, nights));
  const totalAmountDecimal = ratePerNightDecimal.times(nightsDecimal);

  return {
    nights,
    ratePerNight: roundMoney(ratePerNightDecimal),
    totalAmount: roundMoney(totalAmountDecimal),
    ratePlan: plan,
  };
}
