import { z } from 'zod';

export const roomsSchema = z.object({
  id: z.string().optional(),
});

export type RoomsInput = z.infer<typeof roomsSchema>;
