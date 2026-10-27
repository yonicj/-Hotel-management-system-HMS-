export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  category: string;
  currentStock: number;
  minStockLevel: number;
  unit: string;
}
