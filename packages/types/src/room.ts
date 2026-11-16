export type RoomStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'CLEANING' | 'DIRTY' | 'MAINTENANCE' | 'OUT_OF_SERVICE';

export interface RoomType {
  id: string;
  propertyId: string;
  name: string;
  code: string;
  basePrice: number;
  maxOccupancy: number;
  amenities: string[];
}

export interface Room {
  id: string;
  propertyId: string;
  roomTypeId: string;
  floorId: string;
  number: string;
  status: RoomStatus;
  keyCardUid?: string;
}
