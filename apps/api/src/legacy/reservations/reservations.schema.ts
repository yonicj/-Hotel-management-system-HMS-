import { z } from 'zod';
import { ReservationSource } from '@hms/shared-types';

export const createReservationSchema = z.object({
  guestId: z.string().uuid(),
  roomTypeId: z.string().uuid(),
  roomId: z.string().uuid().optional(),
  ratePlanId: z.string().uuid().optional(),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adults: z.number().int().min(1).default(1),
  children: z.number().int().min(0).default(0),
  source: z.nativeEnum(ReservationSource).optional(),
  specialRequests: z.string().optional(),
});

export const updateReservationSchema = createReservationSchema.partial();
export const assignRoomSchema = z.object({ roomId: z.string().uuid() });

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
