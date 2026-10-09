import { getIO } from '../../config/socket';
import { SOCKET_EVENTS, RoomStatusUpdatedPayload } from '@hms/shared-types';

export function emitRoomStatusUpdated(
  hotelId: string,
  payload: RoomStatusUpdatedPayload
): void {
  getIO().to(`hotel:${hotelId}`).emit(SOCKET_EVENTS.ROOM_STATUS_UPDATED, payload);
}
