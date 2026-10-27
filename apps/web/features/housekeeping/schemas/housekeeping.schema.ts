import { z } from 'zod';

export const housekeepingSchema = z.object({
  id: z.string().optional(),
});

export type HousekeepingInput = z.infer<typeof housekeepingSchema>;
