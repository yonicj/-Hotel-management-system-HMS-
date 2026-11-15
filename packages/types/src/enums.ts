// ─── Guest Enums ─────────────────────────────────────────────────────────────

export enum GuestIdType {
  PASSPORT = 'passport',
  NATIONAL_ID = 'national_id',
  DRIVING_LICENSE = 'driving_license',
}

export enum VipLevel {
  STANDARD = 'standard',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
}

// ─── Reservation Source Enum ───────────────────────────────────────────────────

export enum ReservationSource {
  WALK_IN = 'walk_in',
  PHONE = 'phone',
  WEBSITE = 'website',
  OTA = 'ota_booking',
  AGENT = 'agent',
}

// ─── Housekeeping Enums ──────────────────────────────────────────────────────

export enum HousekeepingTaskType {
  CHECKOUT_CLEAN = 'checkout_clean',
  STAYOVER_CLEAN = 'stayover_clean',
  TURNDOWN = 'turndown',
  INSPECTION = 'inspection',
  MAINTENANCE = 'maintenance',
}

export enum HousekeepingTaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  VERIFIED = 'verified',
}

export enum TaskPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

// ─── Billing Enums ───────────────────────────────────────────────────────────

export enum ChargeType {
  ROOM_RATE = 'room_rate',
  FNB = 'f&b',
  MINIBAR = 'minibar',
  LAUNDRY = 'laundry',
  TAX = 'tax',
  SERVICE_CHARGE = 'service_charge',
  MISC = 'misc',
}

// ─── Socket Event Names ──────────────────────────────────────────────────────

export const SOCKET_EVENTS = {
  ROOM_STATUS_UPDATED: 'room:status:updated',
  RESERVATION_CHECKED_IN: 'reservation:checked_in',
  RESERVATION_CHECKED_OUT: 'reservation:checked_out',
  RESERVATION_CREATED: 'reservation:created',
  RESERVATION_CANCELLED: 'reservation:cancelled',
  HOUSEKEEPING_TASK_UPDATED: 'housekeeping:task:updated',
  HOUSEKEEPING_TASK_ASSIGNED: 'housekeeping:task:assigned',
  NIGHT_AUDIT_PROGRESS: 'night_audit:progress',
} as const;
