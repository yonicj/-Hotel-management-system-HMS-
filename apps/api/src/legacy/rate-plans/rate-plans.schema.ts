import { z } from 'zod';

export const createRatePlanSchema = z.object({
  roomTypeId: z.string().uuid(),
  name: z.string().min(1),
  rate: z.number().positive(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  minStay: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const updateRatePlanSchema = createRatePlanSchema.partial();
export type CreateRatePlanInput = z.infer<typeof createRatePlanSchema>;
