import { AxiosInstance } from 'axios';

export interface RoomTypeItem {
  id: string;
  hotelId: string;
  name: string;
  description: string;
  baseRate: number | string;
  maxOccupancy: number;
  amenities: string[] | any;
  createdAt?: string;
}

export interface CreateRoomTypeInput {
  name: string;
  description?: string;
  baseRate: number;
  maxOccupancy: number;
  amenities?: string[];
}

export interface UpdateRoomTypeInput {
  name?: string;
  description?: string;
  baseRate?: number;
  maxOccupancy?: number;
  amenities?: string[];
}

export const createRoomTypesApi = (client: AxiosInstance) => ({
  getAll: async (): Promise<RoomTypeItem[]> => {
    const res = await client.get('/room-types');
    return res.data?.data ?? res.data;
  },
  getById: async (id: string): Promise<RoomTypeItem> => {
    const res = await client.get(`/room-types/${id}`);
    return res.data?.data ?? res.data;
  },
  create: async (data: CreateRoomTypeInput): Promise<RoomTypeItem> => {
    const res = await client.post('/room-types', data);
    return res.data?.data ?? res.data;
  },
  update: async (id: string, data: UpdateRoomTypeInput): Promise<RoomTypeItem> => {
    const res = await client.put(`/room-types/${id}`, data);
    return res.data?.data ?? res.data;
  },
  delete: async (id: string): Promise<void> => {
    await client.delete(`/room-types/${id}`);
  },
});
