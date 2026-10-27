export class ReservationCreatedEvent {
  constructor(
    public readonly reservationId: string,
    public readonly guestId: string,
    public readonly propertyId: string,
    public readonly totalAmount: number
  ) {}
}

export class ReservationCancelledEvent {
  constructor(
    public readonly reservationId: string,
    public readonly reason: string
  ) {}
}
