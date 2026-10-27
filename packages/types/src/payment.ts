export type PaymentMethod = 'CASH' | 'TELEBIRR' | 'CHAPA' | 'CREDIT_CARD' | 'BANK_TRANSFER' | 'CITY_LEDGER';

export interface Payment {
  id: string;
  folioId: string;
  amount: number;
  currency: 'ETB' | 'USD' | 'EUR';
  method: PaymentMethod;
  referenceNumber: string;
  fiscalReceiptNumber?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  createdAt: string;
}
