import { z } from 'zod';

export const ProcessPaymentSchema = z.object({
  folioId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.enum(['ETB', 'USD', 'EUR']).default('ETB'),
  method: z.enum(['CASH', 'TELEBIRR', 'CHAPA', 'CREDIT_CARD', 'BANK_TRANSFER', 'CITY_LEDGER']),
  referenceNumber: z.string().min(1),
  notes: z.string().optional(),
});

export type ProcessPaymentInput = z.infer<typeof ProcessPaymentSchema>;
