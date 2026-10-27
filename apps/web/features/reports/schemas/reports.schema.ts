import { z } from 'zod';

export const reportsSchema = z.object({
  id: z.string().optional(),
});

export type ReportsInput = z.infer<typeof reportsSchema>;
