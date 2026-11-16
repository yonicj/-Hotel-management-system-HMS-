import { z } from 'zod';

export const createRoomSchema = z.object({
  roomTypeId: z.string().uuid(),
  floorId: z.string().uuid(),
  roomNumber: z.string().min(1),
  isSmoking: z.boolean().optional(),
  notes: z.string().optional(),
});

export const updateRoomStatusSchema = z.object({
  status: z.enum(['AVAILABLE', 'RESERVED', 'OCCUPIED', 'CLEANING', 'DIRTY', 'MAINTENANCE', 'OUT_OF_SERVICE']),
  notes: z.string().optional(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomStatusInput = z.infer<typeof updateRoomStatusSchema>;
