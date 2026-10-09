import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';

interface PermissionGuardProps {
  permission: string;
  redirectTo?: string;
}

export function PermissionGuard({ permission, redirectTo = '/dashboard' }: PermissionGuardProps) {
  const user = useAuthStore((s) => s.user);
  const hasPermission = user?.permissions?.includes(permission) ?? false;

  if (!hasPermission) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
