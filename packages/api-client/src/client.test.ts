import { describe, it, expect, vi } from 'vitest';
import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { createApiClient, ApiClientError, isApiClientError } from './client';
import { ErrorCode } from '@ehms/types';

describe('createApiClient', () => {
  const baseUrl = 'http://localhost:4000/api';

  it('automatically attaches Authorization header when getAccessToken is provided', async () => {
    let capturedConfig: InternalAxiosRequestConfig | null = null;

    const client = createApiClient({
      baseUrl,
      getAccessToken: () => 'valid-access-token-123',
    });

    // Mock the adapter
    client.defaults.adapter = async (config) => {
      capturedConfig = config;
      return {
        data: { success: true, data: { status: 'ok' } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      } as AxiosResponse;
    };

    const res = await client.get('/rooms');
    expect(res.status).toBe(200);
    expect(capturedConfig).not.toBeNull();
    expect(capturedConfig!.headers.Authorization).toBe('Bearer valid-access-token-123');
  });

  it('parses standard backend error { error: { code, message, details } } into ApiClientError', async () => {
    const client = createApiClient({ baseUrl });

    client.defaults.adapter = async (config) => {
      const err = new AxiosError('Request failed with status code 409');
      err.response = {
        data: {
          error: {
            code: ErrorCode.ROOM_UNAVAILABLE,
            message: 'The selected room is unavailable for the requested dates.',
            details: { roomId: 'room-101' },
          },
        },
        status: 409,
        statusText: 'Conflict',
        headers: {},
        config,
      } as AxiosResponse;
      throw err;
    };

    try {
      await client.post('/reservations', { roomId: 'room-101' });
      expect.fail('Should have thrown an error');
    } catch (err: any) {
      expect(isApiClientError(err)).toBe(true);
      expect(err).toBeInstanceOf(ApiClientError);
      expect(err.status).toBe(409);
      expect(err.code).toBe(ErrorCode.ROOM_UNAVAILABLE);
      expect(err.message).toBe('The selected room is unavailable for the requested dates.');
      expect(err.details).toEqual({ roomId: 'room-101' });
    }
  });

  it('automatically refreshes token on 401 response and retries the original request', async () => {
    let callCount = 0;
    const tokensRefreshedSpy = vi.fn();
    let currentToken = 'initial-token';

    const client = createApiClient({
      baseUrl,
      getAccessToken: () => currentToken,
      getRefreshToken: () => 'my-refresh-token',
      onTokensRefreshed: (tokens) => {
        currentToken = tokens.accessToken;
        tokensRefreshedSpy(tokens);
      },
    });

    // Mock global axios.post for the refresh call
    const originalPost = axios.post;
    vi.spyOn(axios, 'post').mockImplementation(async (url: string, data?: any) => {
      if (url.includes('/auth/refresh')) {
        return {
          data: {
            success: true,
            message: 'Token refreshed',
            data: {
              accessToken: 'new-rotated-token-456',
              refreshToken: 'new-rotated-refresh-token-789',
            },
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        } as AxiosResponse;
      }
      return originalPost(url, data);
    });

    client.defaults.adapter = async (config) => {
      callCount++;
      if (callCount === 1) {
        // First call fails with 401
        const err = new AxiosError('Unauthorized');
        err.config = config;
        err.response = {
          data: {
            error: {
              code: ErrorCode.UNAUTHORIZED,
              message: 'Token expired',
              details: null,
            },
          },
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config,
        } as AxiosResponse;
        throw err;
      }

      // Second (retried) call succeeds with new token
      return {
        data: { success: true, data: { user: 'admin' } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      } as AxiosResponse;
    };

    const res = await client.get('/auth/me');

    expect(callCount).toBe(2);
    expect(res.status).toBe(200);
    expect(res.data.data.user).toBe('admin');
    expect(tokensRefreshedSpy).toHaveBeenCalledWith({
      accessToken: 'new-rotated-token-456',
      refreshToken: 'new-rotated-refresh-token-789',
    });
  });

  it('queues concurrent 401 requests and executes only one refresh call', async () => {
    let refreshCalls = 0;
    let currentToken = 'initial-token';

    const client = createApiClient({
      baseUrl,
      getAccessToken: () => currentToken,
      getRefreshToken: () => 'my-refresh-token',
      onTokensRefreshed: (tokens) => {
        currentToken = tokens.accessToken;
      },
    });

    vi.spyOn(axios, 'post').mockImplementation(async (url: string) => {
      if (url.includes('/auth/refresh')) {
        refreshCalls++;
        // Small delay to simulate network latency
        await new Promise((r) => setTimeout(r, 20));
        return {
          data: {
            data: {
              accessToken: 'batch-refreshed-token',
            },
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        } as AxiosResponse;
      }
      return { data: {} } as any;
    });

    client.defaults.adapter = async (config) => {
      const authHeader = config.headers?.Authorization;
      if (authHeader !== 'Bearer batch-refreshed-token') {
        const err = new AxiosError('Unauthorized');
        err.config = config;
        err.response = {
          data: { error: { code: ErrorCode.UNAUTHORIZED, message: 'Expired' } },
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config,
        } as AxiosResponse;
        throw err;
      }

      return {
        data: { success: true, endpoint: config.url },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      } as AxiosResponse;
    };

    // Fire 3 simultaneous requests
    const [res1, res2, res3] = await Promise.all([
      client.get('/rooms'),
      client.get('/guests'),
      client.get('/reservations'),
    ]);

    expect(refreshCalls).toBe(1);
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res3.status).toBe(200);
  });

  it('triggers onAuthFailure and rejects when refresh fails', async () => {
    const authFailureSpy = vi.fn();

    const client = createApiClient({
      baseUrl,
      getAccessToken: () => 'bad-token',
      getRefreshToken: () => 'expired-refresh-token',
      onAuthFailure: authFailureSpy,
    });

    vi.spyOn(axios, 'post').mockImplementation(async (url: string) => {
      if (url.includes('/auth/refresh')) {
        const err = new AxiosError('Refresh failed');
        err.response = {
          data: {
            error: {
              code: ErrorCode.UNAUTHORIZED,
              message: 'Refresh token revoked',
              details: null,
            },
          },
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config: {} as any,
        } as AxiosResponse;
        throw err;
      }
      return { data: {} } as any;
    });

    client.defaults.adapter = async (config) => {
      const err = new AxiosError('Unauthorized');
      err.config = config;
      err.response = {
        data: { error: { code: ErrorCode.UNAUTHORIZED, message: 'Access token expired' } },
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config,
      } as AxiosResponse;
      throw err;
    };

    await expect(client.get('/protected-resource')).rejects.toThrow(ApiClientError);
    expect(authFailureSpy).toHaveBeenCalledTimes(1);
  });

  it('does not retry 401s on /auth/login or /auth/refresh to prevent infinite loops', async () => {
    let callCount = 0;
    const authFailureSpy = vi.fn();

    const client = createApiClient({
      baseUrl,
      onAuthFailure: authFailureSpy,
    });

    client.defaults.adapter = async (config) => {
      callCount++;
      const err = new AxiosError('Unauthorized');
      err.config = config;
      err.response = {
        data: { error: { code: ErrorCode.UNAUTHORIZED, message: 'Invalid credentials' } },
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config,
      } as AxiosResponse;
      throw err;
    };

    await expect(client.post('/auth/login', { email: 'wrong@test.com' })).rejects.toThrow(ApiClientError);
    // Must be called exactly once and not retried
    expect(callCount).toBe(1);
  });
});
