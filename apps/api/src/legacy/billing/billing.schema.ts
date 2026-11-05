import { z } from 'zod';
import { ChargeType, PaymentMethod } from '@hms/shared-types';

export const addChargeSchema = z.object({
  chargeType: z.nativeEnum(ChargeType),
  description: z.string().min(1),
  quantity: z.number().int().min(1),
  unitPrice: z.number().positive(),
});

export const addPaymentSchema = z.object({
  amount: z.number().positive(),
  method: z.nativeEnum(PaymentMethod),
  referenceNumber: z.string().optional(),
});

export type AddChargeInput = z.infer<typeof addChargeSchema>;
export type AddPaymentInput = z.infer<typeof addPaymentSchema>;
