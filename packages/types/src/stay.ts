export interface Stay {
  id: string;
  reservationId: string;
  roomId: string;
  guestId: string;
  actualCheckIn: string;
  actualCheckOut?: string;
  keyCardsIssued: number;
}
