import { z } from 'zod';

export const dashboardSchema = z.object({
  id: z.string().optional(),
});

export type DashboardInput = z.infer<typeof dashboardSchema>;
