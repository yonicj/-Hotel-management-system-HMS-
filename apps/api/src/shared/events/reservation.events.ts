import { getIO } from '../../config/socket';
import {
  SOCKET_EVENTS,
  ReservationCheckedInPayload,
  ReservationCheckedOutPayload,
} from '@hms/shared-types';

export function emitReservationCheckedIn(
  hotelId: string,
  payload: ReservationCheckedInPayload
): void {
  getIO().to(`hotel:${hotelId}`).emit(SOCKET_EVENTS.RESERVATION_CHECKED_IN, payload);
}

export function emitReservationCheckedOut(
  hotelId: string,
  payload: ReservationCheckedOutPayload
): void {
  getIO().to(`hotel:${hotelId}`).emit(SOCKET_EVENTS.RESERVATION_CHECKED_OUT, payload);
}
