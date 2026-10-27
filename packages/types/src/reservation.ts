export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'NO_SHOW';

export interface Reservation {
  id: string;
  bookingReference: string;
  propertyId: string;
  guestId: string;
  roomTypeId: string;
  roomId?: string;
  checkInDate: string;
  checkOutDate: string;
  adultsCount: number;
  childrenCount: number;
  status: ReservationStatus;
  totalAmount: number;
  depositAmount: number;
  createdAt: string;
}
