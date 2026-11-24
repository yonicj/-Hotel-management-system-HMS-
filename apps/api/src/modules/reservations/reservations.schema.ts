import { z } from 'zod';

export const createReservationSchema = z.object({
  guestId: z.string().uuid(),
  roomTypeId: z.string().uuid(),
  roomId: z.string().uuid().nullable().optional(),
  ratePlanId: z.string().uuid().nullable().optional(),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adults: z.number().int().min(1).default(1),
  children: z.number().int().min(0).default(0),
  source: z.enum(['WALK_IN','PHONE','WEBSITE','OTA_BOOKING','AGENT']).optional(),
  specialRequests: z.string().nullable().optional(),
});

export const updateReservationSchema = z.object({
  guestId: z.string().uuid().optional(),
  roomTypeId: z.string().uuid().optional(),
  roomId: z.string().uuid().nullable().optional(),
  ratePlanId: z.string().uuid().nullable().optional(),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  adults: z.number().int().min(1).optional(),
  children: z.number().int().min(0).optional(),
  source: z.enum(['WALK_IN', 'PHONE', 'WEBSITE', 'OTA_BOOKING', 'AGENT']).optional(),
  specialRequests: z.string().nullable().optional(),
  status: z
    .enum(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW'])
    .optional(),
});

export const assignRoomSchema = z.object({ roomId: z.string().uuid() });

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type UpdateReservationInput = z.infer<typeof updateReservationSchema>;
