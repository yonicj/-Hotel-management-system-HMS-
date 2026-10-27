import axios, { AxiosInstance } from 'axios';

export interface ApiClientConfig {
  baseUrl: string;
  getAccessToken?: () => string | null;
}

export function createApiClient(config: ApiClientConfig): AxiosInstance {
  const client = axios.create({
    baseURL: config.baseUrl,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  client.interceptors.request.use((req) => {
    if (config.getAccessToken) {
      const token = config.getAccessToken();
      if (token) {
        req.headers.Authorization = `Bearer ${token}`;
      }
    }
    return req;
  });

  return client;
}
