import { AxiosInstance } from 'axios';

export interface FloorItem {
  id: string;
  hotelId: string;
  floorNumber: number;
  name?: string | null;
  description?: string | null;
  createdAt: string;
  rooms?: any[];
}

export interface CreateFloorInput {
  hotelId?: string;
  floorNumber: number;
  name?: string;
  description?: string;
}

export interface UpdateFloorInput {
  name?: string;
  description?: string;
}

export const createFloorsApi = (client: AxiosInstance) => ({
  getAll: async (hotelId?: string): Promise<FloorItem[]> => {
    const res = await client.get('/floors', { params: hotelId ? { hotelId } : undefined });
    return res.data?.data ?? res.data;
  },
  getById: async (id: string): Promise<FloorItem> => {
    const res = await client.get(`/floors/${id}`);
    return res.data?.data ?? res.data;
  },
  create: async (data: CreateFloorInput): Promise<FloorItem> => {
    const res = await client.post('/floors', data);
    return res.data?.data ?? res.data;
  },
  update: async (id: string, data: UpdateFloorInput): Promise<FloorItem> => {
    const res = await client.put(`/floors/${id}`, data);
    return res.data?.data ?? res.data;
  },
  delete: async (id: string): Promise<void> => {
    await client.delete(`/floors/${id}`);
  },
});
