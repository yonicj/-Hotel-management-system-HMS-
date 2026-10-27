import { AxiosInstance } from 'axios';

export const createAuthApi = (client: AxiosInstance) => ({
  login: async (credentials: any) => {
    const res = await client.post('/auth/login', credentials);
    return res.data;
  },
  logout: async () => {
    const res = await client.post('/auth/logout');
    return res.data;
  },
});
