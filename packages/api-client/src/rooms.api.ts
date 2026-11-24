import { AxiosInstance } from 'axios';
import { RoomTypeItem } from './room-types.api';
import { FloorItem } from './floors.api';

export type RoomStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'OCCUPIED'
  | 'CLEANING'
  | 'DIRTY'
  | 'MAINTENANCE'
  | 'OUT_OF_SERVICE';

export interface RoomItem {
  id: string;
  hotelId: string;
  roomTypeId: string;
  floorId: string;
  roomNumber: string;
  status: RoomStatus;
  isSmoking: boolean;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  roomType?: RoomTypeItem;
  floor?: FloorItem;
}

export interface CreateRoomInput {
  roomTypeId: string;
  floorId: string;
  roomNumber: string;
  isSmoking?: boolean;
  notes?: string;
}

export interface UpdateRoomStatusInput {
  status: RoomStatus;
  notes?: string;
}

export const createRoomsApi = (client: AxiosInstance) => ({
  getAll: async (): Promise<RoomItem[]> => {
    const res = await client.get('/rooms');
    return res.data?.data ?? res.data;
  },
  getById: async (id: string): Promise<RoomItem> => {
    const res = await client.get(`/rooms/${id}`);
    return res.data?.data ?? res.data;
  },
  create: async (data: CreateRoomInput): Promise<RoomItem> => {
    const res = await client.post('/rooms', data);
    return res.data?.data ?? res.data;
  },
  updateStatus: async (id: string, status: RoomStatus | string, notes?: string): Promise<RoomItem> => {
    const res = await client.put(`/rooms/${id}/status`, { status, notes });
    return res.data?.data ?? res.data;
  },
  getAvailability: async (params: {
    checkInDate?: string;
    checkOutDate?: string;
    roomTypeId?: string;
    check_in?: string;
    check_out?: string;
    room_type_id?: string;
  }): Promise<RoomItem[]> => {
    const res = await client.get('/rooms/availability', { params });
    return res.data?.data ?? res.data;
  },
});
