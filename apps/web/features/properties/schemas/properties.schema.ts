import { z } from 'zod';

export const propertiesSchema = z.object({
  id: z.string().optional(),
});

export type PropertiesInput = z.infer<typeof propertiesSchema>;
