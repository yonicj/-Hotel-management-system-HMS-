import { z } from 'zod';

export const reservationFormSchema = z.object({
  guestName: z.string().min(2),
  roomTypeId: z.string(),
  checkInDate: z.string(),
  checkOutDate: z.string(),
});
