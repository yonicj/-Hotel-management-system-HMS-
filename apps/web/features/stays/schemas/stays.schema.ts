import { z } from 'zod';

export const staysSchema = z.object({
  id: z.string().optional(),
});

export type StaysInput = z.infer<typeof staysSchema>;
