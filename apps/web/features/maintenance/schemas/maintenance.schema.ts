import { z } from 'zod';

export const maintenanceSchema = z.object({
  id: z.string().optional(),
});

export type MaintenanceInput = z.infer<typeof maintenanceSchema>;
