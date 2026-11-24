import { AxiosInstance } from 'axios';

export type ReservationStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type ReservationSource =
  | 'WALK_IN'
  | 'PHONE'
  | 'WEBSITE'
  | 'OTA_BOOKING'
  | 'AGENT';

export interface ReservationGuestInfo {
  id: string;
  guestId: string;
  isPrimary: boolean;
  guest?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string | null;
    vipLevel?: string;
  };
}

export interface ReservationItem {
  id: string;
  confirmationNumber: string;
  hotelId: string;
  roomTypeId: string;
  roomId?: string | null;
  ratePlanId?: string | null;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  source: ReservationSource | string;
  specialRequests?: string | null;
  totalAmount: number | string;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
  room?: {
    id: string;
    roomNumber: string;
    status: string;
  } | null;
  roomType?: {
    id: string;
    name: string;
    baseRate: number | string;
  } | null;
  ratePlan?: {
    id: string;
    name: string;
    rate: number | string;
  } | null;
  reservationGuests?: ReservationGuestInfo[];
}

export interface CreateReservationInput {
  guestId: string;
  roomTypeId: string;
  roomId?: string | null;
  ratePlanId?: string | null;
  checkInDate: string;
  checkOutDate: string;
  adults?: number;
  children?: number;
  source?: ReservationSource | string;
  specialRequests?: string | null;
}

export interface ModifyReservationInput {
  guestId?: string;
  roomTypeId?: string;
  roomId?: string | null;
  ratePlanId?: string | null;
  checkInDate?: string;
  checkOutDate?: string;
  adults?: number;
  children?: number;
  source?: ReservationSource | string;
  specialRequests?: string | null;
  status?: ReservationStatus | string;
}

export interface ReservationPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ReservationListResult {
  reservations: ReservationItem[];
  pagination: ReservationPaginationMeta;
}

export const createReservationsApi = (client: AxiosInstance) => ({
  getAll: async (params?: Record<string, any>): Promise<ReservationListResult> => {
    const res = await client.get('/reservations', { params });
    const payload = res.data;
    const reservations = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
      ? payload
      : [];
    const pagination = payload?.pagination || {
      page: params?.page || 1,
      limit: params?.limit || 20,
      total: reservations.length,
      totalPages: 1,
    };
    return { reservations, pagination };
  },
  getById: async (id: string): Promise<ReservationItem> => {
    const res = await client.get(`/reservations/${id}`);
    return res.data?.data ?? res.data;
  },
  create: async (data: CreateReservationInput): Promise<ReservationItem> => {
    const res = await client.post('/reservations', data);
    return res.data?.data ?? res.data;
  },
  modify: async (id: string, data: ModifyReservationInput): Promise<ReservationItem> => {
    const res = await client.patch(`/reservations/${id}`, data);
    return res.data?.data ?? res.data;
  },
  cancel: async (id: string): Promise<ReservationItem> => {
    const res = await client.post(`/reservations/${id}/cancel`);
    return res.data?.data ?? res.data;
  },
  confirm: async (id: string): Promise<ReservationItem> => {
    const res = await client.patch(`/reservations/${id}/confirm`);
    return res.data?.data ?? res.data;
  },
  assignRoom: async (id: string, roomId: string): Promise<ReservationItem> => {
    const res = await client.patch(`/reservations/${id}/assign-room`, { roomId });
    return res.data?.data ?? res.data;
  },
});
