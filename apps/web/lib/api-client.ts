import { createApiClient, createEhmsApi, ApiClientError, isApiClientError } from '@ehms/api-client';
import { useAuthStore } from '@/stores/auth.store';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const apiClient = createApiClient({
  baseUrl: API_BASE_URL,
  withCredentials: true,
  getAccessToken: () => {
    const storeToken = useAuthStore.getState().token;
    if (storeToken) return storeToken;
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('accessToken');
      } catch {
        return null;
      }
    }
    return null;
  },
  getRefreshToken: () => {
    const storeRefreshToken = useAuthStore.getState().refreshToken;
    if (storeRefreshToken) return storeRefreshToken;
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('refreshToken');
      } catch {
        return null;
      }
    }
    return null;
  },
  onTokensRefreshed: ({ accessToken, refreshToken }) => {
    useAuthStore.getState().setTokens(accessToken, refreshToken);
  },
  onAuthFailure: () => {
    useAuthStore.getState().logout();
    if (typeof window !== 'undefined') {
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  },
});

export const api = createEhmsApi(apiClient);

export { ApiClientError, isApiClientError };
export default apiClient;
