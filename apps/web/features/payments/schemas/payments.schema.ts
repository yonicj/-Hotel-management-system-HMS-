import { z } from 'zod';

export const paymentsSchema = z.object({
  id: z.string().optional(),
});

export type PaymentsInput = z.infer<typeof paymentsSchema>;
