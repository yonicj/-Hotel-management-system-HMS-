export type FolioStatus = 'OPEN' | 'CLOSED' | 'SETTLED';

export interface FolioItem {
  id: string;
  folioId: string;
  description: string;
  amount: number;
  quantity: number;
  taxAmount: number;
  category: 'ROOM_CHARGE' | 'RESTAURANT' | 'BAR' | 'LAUNDRY' | 'SPA' | 'MISC';
  createdAt: string;
}

export interface Folio {
  id: string;
  reservationId?: string;
  guestId: string;
  status: FolioStatus;
  totalCharges: number;
  totalPayments: number;
  balance: number;
  items: FolioItem[];
}
