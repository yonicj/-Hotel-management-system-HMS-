import { prisma } from '../../config/database';
import { AppError } from '../../shared/utils/app-error';
import { emitRoomStatusUpdated } from '../../shared/events/room-status.events';
import { today } from '@hms/shared-utils';
import { CreateTaskInput, UpdateTaskStatusInput } from './housekeeping.schema';

export async function getTasks(hotelId: string, date?: string) {
  return prisma.housekeepingTask.findMany({
    where: {
      room: { hotelId },
      scheduledDate: date ? new Date(date) : new Date(today()),
    },
    include: {
      room: { include: { roomType: true } },
      assignedUser: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { priority: 'asc' },
  });
}

export async function getTaskById(id: string) {
  const task = await prisma.housekeepingTask.findUnique({
    where: { id },
    include: { room: true, assignedUser: true },
  });
  if (!task) throw new AppError('Task not found', 404);
  return task;
}

export async function createTask(input: CreateTaskInput) {
  return prisma.housekeepingTask.create({
    data: {
      roomId: input.roomId,
      assignedTo: input.assignedTo,
      taskType: input.taskType as any,
      priority: (input.priority as any) ?? 'NORMAL',
      notes: input.notes,
      scheduledDate: new Date(input.scheduledDate),
    },
    include: { room: true, assignedUser: true },
  });
}

export async function updateTaskStatus(id: string, input: UpdateTaskStatusInput) {
  const task = await getTaskById(id);

  const data: any = { status: input.status };
  if (input.notes) data.notes = input.notes;
  if (input.status === 'IN_PROGRESS') data.startedAt = new Date();
  if (input.status === 'COMPLETED' || input.status === 'VERIFIED') {
    data.completedAt = new Date();
  }

  const updated = await prisma.housekeepingTask.update({
    where: { id },
    data,
    include: { room: true },
  });

  // When task completed/verified → room becomes CLEAN
  if (input.status === 'COMPLETED' || input.status === 'VERIFIED') {
    await prisma.room.update({ where: { id: task.roomId }, data: { status: 'CLEAN' } });
    emitRoomStatusUpdated(updated.room.hotelId, {
      roomId: task.roomId,
      roomNumber: updated.room.roomNumber,
      status: 'CLEAN',
      updatedBy: task.assignedTo,
      updatedAt: new Date().toISOString(),
    });
  }

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
