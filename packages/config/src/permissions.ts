export const PERMISSIONS = {
  // Users
  USERS_CREATE: 'users:create',
  USERS_READ: 'users:read',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',

  // Roles
  ROLES_CREATE: 'roles:create',
  ROLES_READ: 'roles:read',
  ROLES_UPDATE: 'roles:update',
  ROLES_DELETE: 'roles:delete',

  // Hotels
  HOTELS_CREATE: 'hotels:create',
  HOTELS_READ: 'hotels:read',
  HOTELS_UPDATE: 'hotels:update',
  HOTELS_DELETE: 'hotels:delete',

  // Floors
  FLOORS_CREATE: 'floors:create',
  FLOORS_READ: 'floors:read',
  FLOORS_UPDATE: 'floors:update',
  FLOORS_DELETE: 'floors:delete',

  // Guests
  GUESTS_CREATE: 'guests:create',
  GUESTS_READ: 'guests:read',
  GUESTS_UPDATE: 'guests:update',
  GUESTS_DELETE: 'guests:delete',

  // Rooms
  ROOMS_CREATE: 'rooms:create',
  ROOMS_READ: 'rooms:read',
  ROOMS_UPDATE: 'rooms:update',
  ROOMS_DELETE: 'rooms:delete',

  // Room Types
  ROOM_TYPES_CREATE: 'room_types:create',
  ROOM_TYPES_READ: 'room_types:read',
  ROOM_TYPES_UPDATE: 'room_types:update',
  ROOM_TYPES_DELETE: 'room_types:delete',

  // Rate Plans
  RATE_PLANS_CREATE: 'rate_plans:create',
  RATE_PLANS_READ: 'rate_plans:read',
  RATE_PLANS_UPDATE: 'rate_plans:update',
  RATE_PLANS_DELETE: 'rate_plans:delete',

  // Reservations
  RESERVATIONS_CREATE: 'reservations:create',
  RESERVATIONS_READ: 'reservations:read',
  RESERVATIONS_UPDATE: 'reservations:update',
  RESERVATIONS_DELETE: 'reservations:delete',

  // Front Desk
  FRONT_DESK_CREATE: 'front_desk:create',
  FRONT_DESK_READ: 'front_desk:read',
  FRONT_DESK_UPDATE: 'front_desk:update',
  FRONT_DESK_DELETE: 'front_desk:delete',

  // Housekeeping
  HOUSEKEEPING_CREATE: 'housekeeping:create',
  HOUSEKEEPING_READ: 'housekeeping:read',
  HOUSEKEEPING_UPDATE: 'housekeeping:update',
  HOUSEKEEPING_DELETE: 'housekeeping:delete',

  // Maintenance
  MAINTENANCE_CREATE: 'maintenance:create',
  MAINTENANCE_READ: 'maintenance:read',
  MAINTENANCE_UPDATE: 'maintenance:update',
  MAINTENANCE_DELETE: 'maintenance:delete',

  // Billing
  BILLING_CREATE: 'billing:create',
  BILLING_READ: 'billing:read',
  BILLING_UPDATE: 'billing:update',
  BILLING_DELETE: 'billing:delete',

  // Night Audit
  NIGHT_AUDIT_CREATE: 'night_audit:create',
  NIGHT_AUDIT_READ: 'night_audit:read',
  NIGHT_AUDIT_UPDATE: 'night_audit:update',
  NIGHT_AUDIT_DELETE: 'night_audit:delete',

  // Reports
  REPORTS_CREATE: 'reports:create',
  REPORTS_READ: 'reports:read',
  REPORTS_UPDATE: 'reports:update',
  REPORTS_DELETE: 'reports:delete',

  // Audit Logs
  AUDIT_LOG_CREATE: 'audit_logs:create',
  AUDIT_LOG_READ: 'audit_logs:read',
  AUDIT_LOG_UPDATE: 'audit_logs:update',
  AUDIT_LOG_DELETE: 'audit_logs:delete',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
export type PermissionKey = keyof typeof PERMISSIONS;

export function splitPermission(permission: Permission | string): { resource: string; action: string } {
  const [resource, action] = permission.split(':');
  return { resource, action };
}
