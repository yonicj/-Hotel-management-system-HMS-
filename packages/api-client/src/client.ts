import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ErrorCode } from '@ehms/types';

export class ApiClientError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details: unknown;
  public readonly isApiClientError = true;

  constructor(message: string, status: number, code: string, details: unknown = null) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, ApiClientError.prototype);
  }
}

export function isApiClientError(err: unknown): err is ApiClientError {
  return (
    err instanceof ApiClientError ||
    (typeof err === 'object' && err !== null && (err as any).isApiClientError === true)
  );
}

export function parseApiError(error: any): ApiClientError {
  if (isApiClientError(error)) {
    return error;
  }

  const status = error?.response?.status ?? (error?.status || 500);
  const data = error?.response?.data;

  // 1. Standard backend payload: { error: { code, message, details } }
  if (data?.error && typeof data.error === 'object') {
    const code =
      data.error.code ||
      (status === 401 ? ErrorCode.UNAUTHORIZED : status === 403 ? ErrorCode.FORBIDDEN : ErrorCode.INTERNAL_ERROR);
    const message = data.error.message || 'An error occurred';
    const details = data.error.details ?? null;
    return new ApiClientError(message, status, code, details);
  }

  // 2. Generic payload with message
  if (typeof data?.message === 'string') {
    return new ApiClientError(
      data.message,
      status,
      status === 401 ? ErrorCode.UNAUTHORIZED : status === 403 ? ErrorCode.FORBIDDEN : ErrorCode.INTERNAL_ERROR,
      data.details ?? data
    );
  }

  // 3. Axios or network error
  if (error?.message) {
    const isNetwork = error.code === 'ERR_NETWORK' || error.message.includes('Network Error');
    return new ApiClientError(
      error.message,
      status,
      isNetwork ? 'NETWORK_ERROR' : (error.code || 'REQUEST_FAILED'),
      null
    );
  }

  return new ApiClientError('An unexpected error occurred', 500, ErrorCode.INTERNAL_ERROR, null);
}

export interface ApiClientConfig {
  baseUrl: string;
  getAccessToken?: () => string | null | undefined;
  getRefreshToken?: () => string | null | undefined;
  onTokensRefreshed?: (tokens: { accessToken: string; refreshToken?: string }) => void;
  onAuthFailure?: () => void;
  withCredentials?: boolean;
}

export function createApiClient(config: ApiClientConfig): AxiosInstance {
  const client = axios.create({
    baseURL: config.baseUrl,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: config.withCredentials ?? true,
  });

  // Attach token automatically
  client.interceptors.request.use((req: InternalAxiosRequestConfig) => {
    if (config.getAccessToken) {
      const token = config.getAccessToken();
      if (token && !req.headers.Authorization) {
        req.headers.Authorization = `Bearer ${token}`;
      }
    }
    return req;
  });

  // 401 Token Refresh and Queue handling
  let isRefreshing = false;
  let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
  }> = [];

  const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token!);
      }
    });
    failedQueue = [];
  };

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = (error.config || error.response?.config) as
        | (InternalAxiosRequestConfig & { _retry?: boolean })
        | undefined;
      const status = error.response?.status;

      if (status === 401 && originalRequest) {
        const url = originalRequest.url || '';
        const isAuthEndpoint =
          url.includes('/auth/login') ||
          url.includes('/auth/refresh') ||
          url.includes('/auth/logout');

        // If the 401 is from an auth endpoint itself or is already a retried request, fail immediately
        if (originalRequest._retry || isAuthEndpoint) {
          if (isAuthEndpoint && url.includes('/auth/refresh')) {
            config.onAuthFailure?.();
          } else if (originalRequest._retry) {
            config.onAuthFailure?.();
          }
          return Promise.reject(parseApiError(error));
        }

        // If a refresh is already in flight, queue this request
        if (isRefreshing) {
          return new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((newToken) => {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return client(originalRequest);
            })
            .catch((err) => Promise.reject(parseApiError(err)));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = config.getRefreshToken ? config.getRefreshToken() : null;
          const refreshUrl = `${config.baseUrl.replace(/\/+$/, '')}/auth/refresh`;

          // Execute refresh request without interceptors to avoid looping
          const res = await axios.post(
            refreshUrl,
            refreshToken ? { refreshToken } : {},
            {
              headers: { 'Content-Type': 'application/json' },
              withCredentials: config.withCredentials ?? true,
            }
          );

          const payload = res.data?.data ?? res.data;
          const newAccessToken = payload?.accessToken;
          const newRefreshToken = payload?.refreshToken;

          if (!newAccessToken) {
            throw new Error('Refresh response missing accessToken');
          }

          if (config.onTokensRefreshed) {
            config.onTokensRefreshed({
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
            });
          }

          processQueue(null, newAccessToken);

          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return client(originalRequest);
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          config.onAuthFailure?.();
          return Promise.reject(parseApiError(refreshErr));
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(parseApiError(error));
    }
  );

  return client;
}
