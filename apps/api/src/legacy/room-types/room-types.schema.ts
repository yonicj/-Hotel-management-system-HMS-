import { z } from 'zod';

export const createRoomTypeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  baseRate: z.number().positive(),
  maxOccupancy: z.number().int().min(1),
  amenities: z.array(z.string()).optional(),
});

export const updateRoomTypeSchema = createRoomTypeSchema.partial();
export type CreateRoomTypeInput = z.infer<typeof createRoomTypeSchema>;
export type UpdateRoomTypeInput = z.infer<typeof updateRoomTypeSchema>;
