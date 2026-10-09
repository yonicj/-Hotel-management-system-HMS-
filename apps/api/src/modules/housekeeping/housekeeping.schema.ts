import { z } from 'zod';
import { HousekeepingTaskType, HousekeepingTaskStatus, TaskPriority } from '@hms/shared-types';

export const createTaskSchema = z.object({
  roomId: z.string().uuid(),
  assignedTo: z.string().uuid(),
  taskType: z.nativeEnum(HousekeepingTaskType),
  priority: z.nativeEnum(TaskPriority).optional(),
  notes: z.string().optional(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const updateTaskStatusSchema = z.object({
  status: z.nativeEnum(HousekeepingTaskStatus),
  notes: z.string().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
