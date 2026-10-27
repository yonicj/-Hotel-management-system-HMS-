export class RoomCleanedEvent {
  constructor(
    public readonly roomId: string,
    public readonly staffId: string
  ) {}
}

export class RoomInspectedEvent {
  constructor(
    public readonly roomId: string,
    public readonly supervisorId: string,
    public readonly passed: boolean
  ) {}
}
