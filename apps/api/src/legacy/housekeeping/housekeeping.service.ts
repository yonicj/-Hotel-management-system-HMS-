import { prisma } from '../../config/database';
import { AppError } from '../../shared/utils/app-error';
import { getIO } from '../../config/socket';
import { SOCKET_EVENTS } from '@hms/shared-types';
import { today } from '@hms/shared-utils';
import { CreateTaskInput, UpdateTaskStatusInput } from './housekeeping.schema';

export async function getTasks(hotelId: string, date?: string) {
  return prisma.housekeepingTask.findMany({
    where: {
      room: { hotelId },
      scheduledDate: date ? new Date(date) : new Date(today()),
    },
    include: { room: { include: { roomType: true } }, assignedUser: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: { priority: 'asc' },
  });
}

export async function getTaskById(id: string) {
  const task = await prisma.housekeepingTask.findUnique({ where: { id }, include: { room: true, assignedUser: true } });
  if (!task) throw new AppError('Task not found', 404);
  return task;
}

export async function createTask(input: CreateTaskInput) {
  return prisma.housekeepingTask.create({
    data: { ...input, scheduledDate: new Date(input.scheduledDate), priority: (input.priority as any) ?? 'NORMAL' } as any,
    include: { room: true, assignedUser: true },
  });
}

export async function updateTaskStatus(id: string, input: UpdateTaskStatusInput) {
  const task = await getTaskById(id);

  const data: any = { status: input.status, notes: input.notes };
  if (input.status === 'IN_PROGRESS') data.startedAt = new Date();
  if (input.status === 'COMPLETED') data.completedAt = new Date();

  const updated = await prisma.housekeepingTask.update({ where: { id }, data, include: { room: true } });

  // Update room status when task is completed/verified
  if (input.status === 'COMPLETED' || input.status === 'VERIFIED') {
    await prisma.room.update({ where: { id: task.roomId }, data: { status: 'CLEAN' } });
  }

  getIO().to(`hotel:${updated.room.hotelId}`).emit(SOCKET_EVENTS.HOUSEKEEPING_TASK_UPDATED, { task: updated });

  return updated;
}

export async function getHousekeepingBoard(hotelId: string) {
  return prisma.room.findMany({
    where: { hotelId },
    include: {
      roomType: true,
      housekeepingTasks: {
        where: { scheduledDate: new Date(today()) },
        include: { assignedUser: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
  });
}
