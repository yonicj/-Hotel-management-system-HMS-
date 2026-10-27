import { AxiosInstance } from 'axios';
import { Room } from '@ehms/types';

export const createRoomsApi = (client: AxiosInstance) => ({
  getAll: async (): Promise<Room[]> => {
    const res = await client.get('/rooms');
    return res.data;
  },
  updateStatus: async (id: string, status: string): Promise<Room> => {
    const res = await client.patch(`/rooms/${id}/status`, { status });
    return res.data;
  },
});
