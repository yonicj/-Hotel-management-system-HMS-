import { useAuthStore } from '@/stores/auth.store';

export function usePermission() {
  const user = useAuthStore((s) => s.user);

  function hasPermission(permission: string): boolean {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN' || user.role === 'Super Admin') return true;
    return user.permissions?.includes(permission) ?? false;
  }

  return { hasPermission };
}
