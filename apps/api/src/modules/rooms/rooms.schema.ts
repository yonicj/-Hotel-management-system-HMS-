import { z } from 'zod';
import { RoomStatus } from '@hms/shared-types';

export const createRoomSchema = z.object({
  roomTypeId: z.string().uuid(),
  roomNumber: z.string().min(1),
  floor: z.number().int().min(0),
  isSmoking: z.boolean().optional(),
  notes: z.string().optional(),
});

export const updateRoomSchema = createRoomSchema.partial();

export const updateRoomStatusSchema = z.object({
  status: z.nativeEnum(RoomStatus),
  notes: z.string().optional(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomStatusInput = z.infer<typeof updateRoomStatusSchema>;
