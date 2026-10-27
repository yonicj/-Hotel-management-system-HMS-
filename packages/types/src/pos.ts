export interface PosOrder {
  id: string;
  outletId: string;
  tableNumber?: string;
  roomId?: string;
  folioId?: string;
  items: Array<{
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  status: 'OPEN' | 'KITCHEN_SENT' | 'SERVED' | 'BILLED';
}
