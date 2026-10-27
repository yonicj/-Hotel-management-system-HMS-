import { useAuthStore } from '@/stores/auth.store';

export function useAuth() {
  const { user, token, setAuth, logout } = useAuthStore();
  return {
    user,
    token,
    isAuthenticated: Boolean(token),
    setAuth,
    logout,
  };
}
