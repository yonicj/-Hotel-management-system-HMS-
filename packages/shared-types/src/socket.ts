import { RoomStatus } from './enums';
import { HousekeepingTask } from './models';

// ─── Socket.IO Event Payloads ────────────────────────────────────────────────

export interface RoomStatusUpdatedPayload {
  roomId: string;
  roomNumber: string;
  status: RoomStatus;
  updatedBy: string;
  updatedAt: string;
}

export interface HousekeepingTaskUpdatedPayload {
  task: HousekeepingTask;
}

export interface ReservationCheckedInPayload {
  reservationId: string;
  confirmationNumber: string;
  roomId: string;
  roomNumber: string;
  guestName: string;
}

export interface ReservationCheckedOutPayload {
  reservationId: string;
  confirmationNumber: string;
  roomId: string;
  roomNumber: string;
}

export interface NightAuditProgressPayload {
  status: 'running' | 'completed' | 'failed';
  step?: string;
  progress?: number; // 0-100
}

// ─── Socket Event Names ──────────────────────────────────────────────────────

export const SOCKET_EVENTS = {
  // Room events
  ROOM_STATUS_UPDATED: 'room:status:updated',

  // Reservation events
  RESERVATION_CHECKED_IN: 'reservation:checked_in',
  RESERVATION_CHECKED_OUT: 'reservation:checked_out',
  RESERVATION_CREATED: 'reservation:created',
  RESERVATION_CANCELLED: 'reservation:cancelled',

  // Housekeeping events
  HOUSEKEEPING_TASK_UPDATED: 'housekeeping:task:updated',
  HOUSEKEEPING_TASK_ASSIGNED: 'housekeeping:task:assigned',

  // Night audit events
  NIGHT_AUDIT_PROGRESS: 'night_audit:progress',
} as const;
