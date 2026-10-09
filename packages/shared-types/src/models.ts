import {
  RoomStatus,
  ReservationStatus,
  ReservationSource,
  GuestIdType,
  VipLevel,
  HousekeepingTaskType,
  HousekeepingTaskStatus,
  TaskPriority,
  ChargeType,
  PaymentMethod,
  PaymentStatus,
  FolioStatus,
  NightAuditStatus,
} from './enums';

// ─── Hotel ───────────────────────────────────────────────────────────────────

export interface Hotel {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  timezone: string;
  createdAt: string;
}

// ─── Room Type ───────────────────────────────────────────────────────────────

export interface RoomType {
  id: string;
  hotelId: string;
  name: string;
  description: string;
  baseRate: number;
  maxOccupancy: number;
  amenities: string[];
  createdAt: string;
}

// ─── Room ────────────────────────────────────────────────────────────────────

export interface Room {
  id: string;
  hotelId: string;
  roomTypeId: string;
  roomType?: RoomType;
  roomNumber: string;
  floor: number;
  status: RoomStatus;
  isSmoking: boolean;
  notes?: string;
  createdAt: string;
}

// ─── Rate Plan ───────────────────────────────────────────────────────────────

export interface RatePlan {
  id: string;
  hotelId: string;
  roomTypeId: string;
  name: string;
  rate: number;
  startDate: string;
  endDate: string;
  minStay: number;
  isActive: boolean;
}

// ─── Guest ───────────────────────────────────────────────────────────────────

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  phone: string;
  nationality?: string;
  idType?: GuestIdType;
  idNumber?: string;
  dateOfBirth?: string;
  address?: string;
  vipLevel: VipLevel;
  notes?: string;
  createdAt: string;
}

// ─── Reservation ─────────────────────────────────────────────────────────────

export interface Reservation {
  id: string;
  confirmationNumber: string;
  hotelId: string;
  guestId: string;
  guest?: Guest;
  roomTypeId: string;
  roomType?: RoomType;
  roomId?: string;
  room?: Room;
  ratePlanId?: string;
  ratePlan?: RatePlan;
  checkInDate: string;
  checkOutDate: string;
  actualCheckIn?: string;
  actualCheckOut?: string;
  adults: number;
  children: number;
  status: ReservationStatus;
  source: ReservationSource;
  specialRequests?: string;
  totalAmount: number;
  createdBy: string;
  createdAt: string;
}

// ─── Folio ───────────────────────────────────────────────────────────────────

export interface Folio {
  id: string;
  reservationId: string;
  folioNumber: string;
  status: FolioStatus;
  charges?: FolioCharge[];
  payments?: Payment[];
  totalCharges?: number;
  totalPayments?: number;
  balance?: number;
  createdAt: string;
}

export interface FolioCharge {
  id: string;
  folioId: string;
  chargeType: ChargeType;
  description: string;
  amount: number;
  quantity: number;
  unitPrice: number;
  postedBy: string;
  postedAt: string;
}

// ─── Payment ─────────────────────────────────────────────────────────────────

export interface Payment {
  id: string;
  folioId: string;
  reservationId: string;
  amount: number;
  method: PaymentMethod;
  referenceNumber?: string;
  status: PaymentStatus;
  processedBy: string;
  processedAt: string;
}

// ─── Housekeeping ────────────────────────────────────────────────────────────

export interface HousekeepingTask {
  id: string;
  roomId: string;
  room?: Room;
  assignedTo: string;
  assignedUser?: User;
  taskType: HousekeepingTaskType;
  status: HousekeepingTaskStatus;
  priority: TaskPriority;
  notes?: string;
  scheduledDate: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  hotelId: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  roleId: string;
  role?: Role;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions?: Permission[];
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
}

// ─── Night Audit ─────────────────────────────────────────────────────────────

export interface NightAuditLog {
  id: string;
  hotelId: string;
  auditDate: string;
  status: NightAuditStatus;
  totalRoomsOccupied: number;
  totalRevenue: number;
  runBy: string;
  completedAt?: string;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  hotelId: string;
  permissions: string[]; // e.g. ["reservations:read", "reservations:create"]
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
}
