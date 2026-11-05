import { prisma } from '../../config/database';
import { AppError } from '../../shared/utils/app-error';
import { roundMoney } from '@hms/shared-utils';
import { AddChargeInput, AddPaymentInput } from './billing.schema';

async function getFolioOrThrow(folioId: string) {
  const folio = await prisma.folio.findUnique({
    where: { id: folioId },
    include: { charges: true, payments: true },
  });
  if (!folio) throw new AppError('Folio not found', 404);
  return folio;
}

export async function getFolio(folioId: string) {
  const folio = await getFolioOrThrow(folioId);
  const totalCharges = folio.charges.reduce((s, c) => s + Number(c.amount), 0);
  const totalPayments = folio.payments.filter((p) => p.status === 'COMPLETED').reduce((s, p) => s + Number(p.amount), 0);
  return { ...folio, totalCharges: roundMoney(totalCharges), totalPayments: roundMoney(totalPayments), balance: roundMoney(totalCharges - totalPayments) };
}

export async function addCharge(folioId: string, input: AddChargeInput, postedBy: string) {
  const folio = await getFolioOrThrow(folioId);
  if (folio.status === 'CLOSED') throw new AppError('Cannot add charges to a closed folio', 400);

  const amount = roundMoney(input.quantity * input.unitPrice);
  return prisma.folioCharge.create({
    data: { folioId, ...input, amount, chargeType: input.chargeType as any, postedBy },
  });
}

export async function deleteCharge(folioId: string, chargeId: string) {
  const folio = await getFolioOrThrow(folioId);
  if (folio.status === 'CLOSED') throw new AppError('Cannot remove charges from a closed folio', 400);
  await prisma.folioCharge.delete({ where: { id: chargeId } });
}

export async function addPayment(folioId: string, input: AddPaymentInput, processedBy: string) {
  const folio = await getFolioOrThrow(folioId);
  const reservation = await prisma.reservation.findFirst({ where: { folios: { some: { id: folioId } } } });
  if (!reservation) throw new AppError('Reservation not found for folio', 404);

  return prisma.payment.create({
    data: { folioId, reservationId: reservation.id, ...input, method: input.method as any, status: 'COMPLETED', processedBy },
  });
}

export async function closeFolio(folioId: string) {
  const folio = await getFolio(folioId);
  if (folio.balance > 0) throw new AppError(`Outstanding balance of ${folio.balance}. Settle before closing.`, 400);
  return prisma.folio.update({ where: { id: folioId }, data: { status: 'CLOSED' } });
}

export async function getInvoice(folioId: string) {
  return getFolio(folioId);
}
