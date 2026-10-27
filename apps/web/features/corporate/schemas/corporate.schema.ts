import { z } from 'zod';

export const corporateSchema = z.object({
  id: z.string().optional(),
});

export type CorporateInput = z.infer<typeof corporateSchema>;
