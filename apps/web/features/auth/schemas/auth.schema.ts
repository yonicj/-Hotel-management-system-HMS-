import { z } from 'zod';

export const authSchema = z.object({
  id: z.string().optional(),
});

export type AuthInput = z.infer<typeof authSchema>;
