import { z } from 'zod';

export const CreateReservationSchema = z.object({
  propertyId: z.string().uuid(),
  guestId: z.string().uuid(),
  roomTypeId: z.string().uuid(),
  roomId: z.string().uuid().optional(),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid check-in date (YYYY-MM-DD)'),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid check-out date (YYYY-MM-DD)'),
  adultsCount: z.number().int().min(1),
  childrenCount: z.number().int().min(0).default(0),
  ratePlanId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export type CreateReservationInput = z.infer<typeof CreateReservationSchema>;
