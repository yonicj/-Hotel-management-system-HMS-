import { z } from 'zod';

export const guestsSchema = z.object({
  id: z.string().optional(),
});

export type GuestsInput = z.infer<typeof guestsSchema>;
