import { AxiosInstance } from 'axios';
import { Guest } from '@ehms/types';

export const createGuestsApi = (client: AxiosInstance) => ({
  getAll: async (): Promise<Guest[]> => {
    const res = await client.get('/guests');
    return res.data;
  },
});
