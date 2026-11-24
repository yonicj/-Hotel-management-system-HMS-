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

export const roomAvailabilityQuerySchema = z.object({
  checkInDate: z.string().optional(),
  checkOutDate: z.string().optional(),
  roomTypeId: z.string().uuid().optional(),
  check_in: z.string().optional(),
  check_out: z.string().optional(),
  room_type_id: z.string().uuid().optional(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomStatusInput = z.infer<typeof updateRoomStatusSchema>;
export type RoomAvailabilityQuery = z.infer<typeof roomAvailabilityQuerySchema>;
