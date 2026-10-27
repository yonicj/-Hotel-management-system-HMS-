import { z } from 'zod';

export const purchasingSchema = z.object({
  id: z.string().optional(),
});

export type PurchasingInput = z.infer<typeof purchasingSchema>;
