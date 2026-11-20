import { prisma } from '../../config/database';
import { AppError } from '../../shared/utils/app-error';
import { emitRoomStatusUpdated } from '../../shared/events/room-status.events';
import { recordAuditLog, AUDIT_ACTIONS } from '../../shared/utils/audit';
import { today } from '@ehms/utils';
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

export async function createTask(input: CreateTaskInput, userId?: string) {
  const resolvedUserId = userId || input.assignedTo;

  return prisma.$transaction(async (tx) => {
    const task = await tx.housekeepingTask.create({
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

    await recordAuditLog({
      userId: resolvedUserId,
      action: AUDIT_ACTIONS.HOUSEKEEPING_TASK_CREATED,
      entityType: 'HousekeepingTask',
      entityId: task.id,
      changes: {
        roomId: task.roomId,
        assignedTo: task.assignedTo,
        taskType: task.taskType,
        priority: task.priority,
        status: task.status,
        scheduledDate: input.scheduledDate,
      },
      tx,
    });

    return task;
  });
}

export async function updateTaskStatus(
  id: string,
  input: UpdateTaskStatusInput,
  userId?: string
) {
  const task = await getTaskById(id);
  const resolvedUserId = userId || task.assignedTo;

  const data: any = { status: input.status };
  if (input.notes) data.notes = input.notes;
  if (input.status === 'IN_PROGRESS') data.startedAt = new Date();
  if (input.status === 'COMPLETED' || input.status === 'VERIFIED') {
    data.completedAt = new Date();
  }

  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.housekeepingTask.update({
      where: { id },
      data,
      include: { room: true },
    });

    await recordAuditLog({
      userId: resolvedUserId,
      action: AUDIT_ACTIONS.HOUSEKEEPING_TASK_UPDATED,
      entityType: 'HousekeepingTask',
      entityId: id,
      changes: {
        before: { status: task.status, notes: task.notes },
        after: { status: input.status, notes: input.notes ?? task.notes },
      },
      tx,
    });

    // When task completed/verified → room becomes AVAILABLE
    if (input.status === 'COMPLETED' || input.status === 'VERIFIED') {
      const prevRoomStatus = task.room.status;
      await tx.room.update({ where: { id: task.roomId }, data: { status: 'AVAILABLE' } });

      await recordAuditLog({
        userId: resolvedUserId,
        action: AUDIT_ACTIONS.ROOM_STATUS_UPDATED,
        entityType: 'Room',
        entityId: task.roomId,
        changes: {
          before: { status: prevRoomStatus },
          after: { status: 'AVAILABLE' },
          reason: `Housekeeping task ${input.status.toLowerCase()}`,
        },
        tx,
      });
    }

    return res;
  });

  if (input.status === 'COMPLETED' || input.status === 'VERIFIED') {
    emitRoomStatusUpdated(updated.room.hotelId, {
      roomId: task.roomId,
      roomNumber: updated.room.roomNumber,
      status: 'AVAILABLE',
      updatedBy: resolvedUserId,
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
      floor: true,
      housekeepingTasks: {
        where: { scheduledDate: new Date(today()) },
        include: { assignedUser: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: [{ floor: { floorNumber: 'asc' } }, { roomNumber: 'asc' }],
  });
}
