export interface ReservationItem {
  id: string;
  guestName: string;
  roomNumber: string;
  checkInDate: string;
  checkOutDate: string;
  status: 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';
  totalPrice: number;
}
