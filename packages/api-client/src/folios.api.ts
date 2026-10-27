import { AxiosInstance } from 'axios';
import { Folio } from '@ehms/types';

export const createFoliosApi = (client: AxiosInstance) => ({
  getById: async (id: string): Promise<Folio> => {
    const res = await client.get(`/folios/${id}`);
    return res.data;
  },
});
