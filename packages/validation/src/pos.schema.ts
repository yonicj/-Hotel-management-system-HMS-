import { z } from 'zod';

export const CreatePosOrderSchema = z.object({
  outletId: z.string().uuid(),
  tableNumber: z.string().optional(),
  roomId: z.string().uuid().optional(),
  items: z.array(z.object({
    menuItemId: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).min(1),
});

export type CreatePosOrderInput = z.infer<typeof CreatePosOrderSchema>;
