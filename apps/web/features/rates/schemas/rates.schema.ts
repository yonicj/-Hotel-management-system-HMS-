import { z } from 'zod';

export const ratesSchema = z.object({
  id: z.string().optional(),
});

export type RatesInput = z.infer<typeof ratesSchema>;
