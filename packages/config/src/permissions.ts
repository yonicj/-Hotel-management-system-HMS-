export const PERMISSIONS = {
  // Front Desk & Reservations
  RESERVATIONS_CREATE: 'reservations:create',
  RESERVATIONS_VIEW: 'reservations:view',
  RESERVATIONS_MODIFY: 'reservations:modify',
  RESERVATIONS_CANCEL: 'reservations:cancel',
  CHECKIN_PROCESS: 'checkin:process',
  CHECKOUT_PROCESS: 'checkout:process',

  // Billing & Folios
  FOLIOS_VIEW: 'folios:view',
  FOLIOS_POST_CHARGE: 'folios:post_charge',
  FOLIOS_SETTLE: 'folios:settle',
  PAYMENTS_ACCEPT: 'payments:accept',
  PAYMENTS_REFUND: 'payments:refund',

  // Operations
  HOUSEKEEPING_MANAGE: 'housekeeping:manage',
  HOUSEKEEPING_INSPECT: 'housekeeping:inspect',
  MAINTENANCE_REQUEST: 'maintenance:request',
  MAINTENANCE_RESOLVE: 'maintenance:resolve',

  // Administration
  NIGHT_AUDIT_EXECUTE: 'night_audit:execute',
  REPORTS_FINANCIAL_VIEW: 'reports:financial_view',
  SYSTEM_CONFIG_MANAGE: 'system_config:manage',
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
