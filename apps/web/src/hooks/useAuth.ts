import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../stores/auth.store';
import { useNotificationStore } from '../stores/notification.store';
import type { AuthUser } from '@hms/shared-types';

export function useLogin() {
  const { login } = useAuthStore();
  const { add } = useNotificationStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login(email, password),
    onSuccess: (data: { accessToken: string; user: AuthUser }) => {
      login(data.user, data.accessToken);
      navigate('/dashboard');
    },
    onError: () => {
      add({ type: 'error', title: 'Login failed', message: 'Invalid email or password' });
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authService.logout,
    onSettled: () => {
      logout();
      navigate('/login');
    },
  });
}

export function useCurrentUser() {
  return useAuthStore((state) => state.user);
}

export function useHasPermission(permission: string) {
  const user = useAuthStore((state) => state.user);
  return user?.permissions?.includes(permission) ?? false;
}
