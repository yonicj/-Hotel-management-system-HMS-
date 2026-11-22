import { useAuthStore } from '@/stores/auth.store';

export function usePermission() {
  const user = useAuthStore((s) => s.user);

  function hasPermission(permission: string): boolean {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN' || user.role === 'Super Admin') return true;
    return user.permissions?.includes(permission) ?? false;
  }

  function hasAnyPermission(permissions: string[]): boolean {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN' || user.role === 'Super Admin') return true;
    return permissions.some((p) => user.permissions?.includes(p));
  }

  function hasAllPermissions(permissions: string[]): boolean {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN' || user.role === 'Super Admin') return true;
    return permissions.every((p) => user.permissions?.includes(p));
  }

  return {
    user,
    role: user?.role,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}
