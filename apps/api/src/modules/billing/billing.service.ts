import { prisma } from '../../config/database';
import { AppError } from '../../shared/utils/app-error';
import { ErrorCode } from '@ehms/types';
import { Decimal, roundMoney } from '@ehms/utils';
import { recordAuditLog, AUDIT_ACTIONS } from '../../shared/utils/audit';
import { AddChargeInput, AddPaymentInput } from './billing.schema';

async function getFolioOrThrow(folioId: string) {
  const folio = await prisma.folio.findUnique({
    where: { id: folioId },
    include: { charges: true, payments: true },
  });
  if (!folio) throw new AppError('Folio not found', 404, ErrorCode.NOT_FOUND);
  return folio;
}

export async function getFolio(folioId: string) {
  const folio = await getFolioOrThrow(folioId);
  const totalCharges = folio.charges.reduce(
    (sum, c) => sum.plus(new Decimal(c.amount.toString())),
    new Decimal(0)
  );
  const totalPayments = folio.payments
    .filter((p) => p.status === 'COMPLETED')
    .reduce(
      (sum, p) => sum.plus(new Decimal(p.amount.toString())),
      new Decimal(0)
    );
  const balance = totalCharges.minus(totalPayments);

  return {
    ...folio,
    totalCharges: roundMoney(totalCharges),
    totalPayments: roundMoney(totalPayments),
    balance: roundMoney(balance),
  };
}

export async function addCharge(folioId: string, input: AddChargeInput, postedBy: string) {
  const folio = await getFolioOrThrow(folioId);
  if (folio.status === 'CLOSED') {
    throw new AppError('Cannot add charges to a closed folio', 400, ErrorCode.BAD_REQUEST);
  }

  const quantity = new Decimal(input.quantity);
  const unitPrice = new Decimal(input.unitPrice);
  const amount = roundMoney(quantity.times(unitPrice));

  return prisma.$transaction(async (tx) => {
    const charge = await tx.folioCharge.create({
      data: {
        folioId,
        chargeType: input.chargeType as any,
        description: input.description,
        quantity: input.quantity,
        unitPrice: input.unitPrice,
        amount,
        postedBy,
      },
    });

    await recordAuditLog({
      userId: postedBy,
      action: AUDIT_ACTIONS.FOLIO_CHARGE_POSTED,
      entityType: 'FolioCharge',
      entityId: charge.id,
      changes: {
        folioId,
        chargeType: input.chargeType,
        description: input.description,
        quantity: input.quantity,
        unitPrice: input.unitPrice.toString(),
        amount: amount.toString(),
      },
      tx,
    });

    return charge;
  });
}

export async function deleteCharge(_folioId: string, _chargeId: string) {
  throw new AppError(
    'Hard deletion of charges is prohibited. Financial records must be voided or adjusted via credit reversal in Phase 6.',
    400,
    ErrorCode.BAD_REQUEST
  );
}

export async function addPayment(folioId: string, input: AddPaymentInput, processedBy: string) {
  await getFolioOrThrow(folioId);
  const reservation = await prisma.reservation.findFirst({
    where: { folios: { some: { id: folioId } } },
  });
  if (!reservation) throw new AppError('Reservation not found for folio', 404, ErrorCode.NOT_FOUND);

  const paymentAmount = roundMoney(new Decimal(input.amount));

  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        folioId,
        reservationId: reservation.id,
        amount: paymentAmount,
        method: input.method as any,
        referenceNumber: input.referenceNumber,
        status: 'COMPLETED',
        processedBy,
      },
    });

    await recordAuditLog({
      userId: processedBy,
      action: AUDIT_ACTIONS.PAYMENT_RECORDED,
      entityType: 'Payment',
      entityId: payment.id,
      changes: {
        folioId,
        reservationId: reservation.id,
        amount: paymentAmount.toString(),
        method: input.method,
        referenceNumber: input.referenceNumber,
        status: 'COMPLETED',
      },
      tx,
    });

    return payment;
  });
}

export async function closeFolio(folioId: string, userId?: string) {
  const folio = await getFolio(folioId);
  const balanceDecimal = new Decimal(folio.balance);
  if (balanceDecimal.greaterThan(0)) {
    throw new AppError(
      `Outstanding balance of ${folio.balance}. Settle before closing.`,
      400,
      ErrorCode.BALANCE_DUE,
      { balance: folio.balance }
    );
  }

  const resolvedUserId = userId || 'system';

  return prisma.$transaction(async (tx) => {
    const updated = await tx.folio.update({
      where: { id: folioId },
      data: { status: 'CLOSED' },
    });

    await recordAuditLog({
      userId: resolvedUserId,
      action: AUDIT_ACTIONS.FOLIO_CLOSED,
      entityType: 'Folio',
      entityId: folioId,
      changes: {
        before: { status: folio.status },
        after: { status: 'CLOSED' },
        balance: folio.balance.toString(),
      },
      tx,
    });

    return updated;
  });
}

export async function getInvoice(folioId: string) {
  return getFolio(folioId);
}
