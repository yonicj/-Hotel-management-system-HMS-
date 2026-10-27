import { z } from 'zod';

export const frontDeskSchema = z.object({
  id: z.string().optional(),
});

export type FrontDeskInput = z.infer<typeof frontDeskSchema>;
