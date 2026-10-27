import { z } from 'zod';

export const kitchenSchema = z.object({
  id: z.string().optional(),
});

export type KitchenInput = z.infer<typeof kitchenSchema>;
