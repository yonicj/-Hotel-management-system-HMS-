import { z } from 'zod';

export const createTaskSchema = z.object({
  roomId: z.string().uuid(),
  assignedTo: z.string().uuid(),
  taskType: z.enum(['CHECKOUT_CLEAN', 'STAYOVER_CLEAN', 'TURNDOWN', 'INSPECTION', 'MAINTENANCE']),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  notes: z.string().optional(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED']),
  notes: z.string().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
