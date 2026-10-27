import { z } from 'zod';

export const reservationsSchema = z.object({
  id: z.string().optional(),
});

export type ReservationsInput = z.infer<typeof reservationsSchema>;
