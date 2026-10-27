export class PaymentProcessedEvent {
  constructor(
    public readonly paymentId: string,
    public readonly folioId: string,
    public readonly amount: number,
    public readonly method: string
  ) {}
}
