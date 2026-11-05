import { getIO } from '../../config/socket';

export interface RoomStatusUpdatedPayload {
  roomId: string;
  roomNumber: string;
  status: string;
  updatedBy: string;
  updatedAt: string;
}

export function emitRoomStatusUpdated(
  hotelId: string,
  payload: RoomStatusUpdatedPayload
): void {
  try {
    getIO().to(`hotel:${hotelId}`).emit('room:status:updated', payload);
  } catch {
    // Socket not yet initialised — safe to ignore during startup
  }
}
