export class RoomStatusChangedEvent {
  constructor(
    public readonly roomId: string,
    public readonly previousStatus: string,
    public readonly newStatus: string,
    public readonly changedBy: string
  ) {}
}
