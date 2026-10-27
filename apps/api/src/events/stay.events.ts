export class GuestCheckedInEvent {
  constructor(
    public readonly stayId: string,
    public readonly roomId: string,
    public readonly guestId: string
  ) {}
}

export class GuestCheckedOutEvent {
  constructor(
    public readonly stayId: string,
    public readonly roomId: string,
    public readonly folioId: string
  ) {}
}
