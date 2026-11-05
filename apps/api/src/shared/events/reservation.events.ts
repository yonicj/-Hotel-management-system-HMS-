import { getIO } from '../../config/socket';

export interface ReservationCheckedInPayload {
  reservationId: string;
  confirmationNumber: string;
  roomId: string;
  roomNumber: string;
  guestName: string;
}

export interface ReservationCheckedOutPayload {
  reservationId: string;
  confirmationNumber: string;
  roomId: string;
  roomNumber: string;
}

export function emitReservationCheckedIn(
  hotelId: string,
  payload: ReservationCheckedInPayload
): void {
  try {
    getIO().to(`hotel:${hotelId}`).emit('reservation:checked_in', payload);
  } catch {
    // Socket not yet initialised — safe to ignore
  }
}

export function emitReservationCheckedOut(
  hotelId: string,
  payload: ReservationCheckedOutPayload
): void {
  try {
    getIO().to(`hotel:${hotelId}`).emit('reservation:checked_out', payload);
  } catch {
    // Socket not yet initialised — safe to ignore
  }
}
