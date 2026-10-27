import { z } from 'zod';

export const foliosSchema = z.object({
  id: z.string().optional(),
});

export type FoliosInput = z.infer<typeof foliosSchema>;
