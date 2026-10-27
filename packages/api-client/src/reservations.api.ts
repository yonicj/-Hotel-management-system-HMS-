import { AxiosInstance } from 'axios';
import { Reservation } from '@ehms/types';

export const createReservationsApi = (client: AxiosInstance) => ({
  getAll: async (): Promise<Reservation[]> => {
    const res = await client.get('/reservations');
    return res.data;
  },
  getById: async (id: string): Promise<Reservation> => {
    const res = await client.get(`/reservations/${id}`);
    return res.data;
  },
  create: async (data: any): Promise<Reservation> => {
    const res = await client.post('/reservations', data);
    return res.data;
  },
});
