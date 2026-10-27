import { AxiosInstance } from 'axios';
import { Payment } from '@ehms/types';

export const createPaymentsApi = (client: AxiosInstance) => ({
  process: async (data: any): Promise<Payment> => {
    const res = await client.post('/payments', data);
    return res.data;
  },
});
