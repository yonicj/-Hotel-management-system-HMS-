import { z } from 'zod';

export const settingsSchema = z.object({
  id: z.string().optional(),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
