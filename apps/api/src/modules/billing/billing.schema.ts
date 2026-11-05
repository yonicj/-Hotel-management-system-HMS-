import { z } from 'zod';

export const addChargeSchema = z.object({
  chargeType: z.enum(['ROOM_RATE', 'FNB', 'MINIBAR', 'LAUNDRY', 'TAX', 'SERVICE_CHARGE', 'MISC']),
  description: z.string().min(1),
  quantity: z.number().int().min(1),
  unitPrice: z.number().positive(),
});

export const addPaymentSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'MPESA', 'VOUCHER']),
  referenceNumber: z.string().optional(),
});

export type AddChargeInput = z.infer<typeof addChargeSchema>;
export type AddPaymentInput = z.infer<typeof addPaymentSchema>;
