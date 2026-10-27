import { z } from 'zod';

export const inventorySchema = z.object({
  id: z.string().optional(),
});

export type InventoryInput = z.infer<typeof inventorySchema>;
