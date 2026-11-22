import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  permissions: string[];
  hotelId?: string;
}

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  setAuth: (user: AuthUser, token: string, refreshToken?: string | null) => void;
  setTokens: (token: string, refreshToken?: string | null) => void;
  logout: () => void;
}

const getStoredToken = () => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('accessToken');
  } catch {
    return null;
  }
};

const getStoredRefreshToken = () => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('refreshToken');
  } catch {
    return null;
  }
};

const getStoredUser = (): AuthUser | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: getStoredUser(),
  token: getStoredToken(),
  refreshToken: getStoredRefreshToken(),
  setAuth: (user, token, refreshToken = null) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('accessToken', token);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
      } catch (e) {
        console.error('Failed to save auth to localStorage', e);
      }
    }
    set((state) => ({
      user,
      token,
      refreshToken: refreshToken ?? state.refreshToken,
    }));
  },
  setTokens: (token, refreshToken) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('accessToken', token);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
      } catch (e) {
        console.error('Failed to save tokens to localStorage', e);
      }
    }
    set((state) => ({
      token,
      refreshToken: refreshToken !== undefined ? refreshToken : state.refreshToken,
    }));
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      } catch (e) {
        console.error('Failed to clear auth from localStorage', e);
      }
    }
    set({ user: null, token: null, refreshToken: null });
  },
}));
