import { z } from 'zod';

export const lostFoundSchema = z.object({
  id: z.string().optional(),
});

export type LostFoundInput = z.infer<typeof lostFoundSchema>;
