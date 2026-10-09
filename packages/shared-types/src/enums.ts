// ─── Room Enums ─────────────────────────────────────────────────────────────

export enum RoomStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  DIRTY = 'dirty',
  CLEAN = 'clean',
  MAINTENANCE = 'maintenance',
  OUT_OF_ORDER = 'out_of_order',
}

// ─── Reservation Enums ───────────────────────────────────────────────────────

export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  CHECKED_OUT = 'checked_out',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum ReservationSource {
  WALK_IN = 'walk_in',
  PHONE = 'phone',
  WEBSITE = 'website',
  OTA = 'ota_booking',
  AGENT = 'agent',
}

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

export enum PaymentMethod {
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  MPESA = 'mpesa',
  VOUCHER = 'voucher',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum FolioStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

// ─── User & Role Enums ───────────────────────────────────────────────────────

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  RECEPTIONIST = 'receptionist',
  HOUSEKEEPING = 'housekeeping',
  ACCOUNTANT = 'accountant',
}

// ─── Night Audit Enums ───────────────────────────────────────────────────────

export enum NightAuditStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
}
