import { AxiosInstance } from 'axios';

export type GuestIdTypeEnum = 'PASSPORT' | 'NATIONAL_ID' | 'DRIVING_LICENSE';
export type VipLevelEnum = 'STANDARD' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface GuestItem {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone: string;
  nationality?: string | null;
  idType?: GuestIdTypeEnum | string | null;
  idNumber?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  vipLevel: VipLevelEnum | string;
  notes?: string | null;
  createdAt: string;
  reservationGuests?: Array<{
    id: string;
    guestId: string;
    reservationId: string;
    isPrimary: boolean;
    reservation?: {
      id: string;
      confirmationNumber: string;
      checkInDate: string;
      checkOutDate: string;
      status: string;
      room?: { roomNumber: string };
      roomType?: { name: string };
    };
  }>;
}

export interface CreateGuestInput {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  nationality?: string | null;
  idType?: string | null;
  idNumber?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  vipLevel?: string | null;
  notes?: string | null;
}

export interface UpdateGuestInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string | null;
  nationality?: string | null;
  idType?: string | null;
  idNumber?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  vipLevel?: string | null;
  notes?: string | null;
}

export interface GuestPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GuestListResult {
  guests: GuestItem[];
  pagination: GuestPaginationMeta;
}

export const createGuestsApi = (client: AxiosInstance) => ({
  getAll: async (params?: { search?: string; page?: number; limit?: number }): Promise<GuestListResult> => {
    const res = await client.get('/guests', { params });
    const payload = res.data;
    const guests = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
    const pagination = payload?.pagination || {
      page: params?.page || 1,
      limit: params?.limit || 20,
      total: guests.length,
      totalPages: 1,
    };
    return { guests, pagination };
  },
  getById: async (id: string): Promise<GuestItem> => {
    const res = await client.get(`/guests/${id}`);
    return res.data?.data ?? res.data;
  },
  create: async (data: CreateGuestInput): Promise<GuestItem> => {
    const res = await client.post('/guests', data);
    return res.data?.data ?? res.data;
  },
  update: async (id: string, data: UpdateGuestInput): Promise<GuestItem> => {
    const res = await client.put(`/guests/${id}`, data);
    return res.data?.data ?? res.data;
  },
  getReservations: async (guestId: string): Promise<any[]> => {
    const res = await client.get(`/guests/${guestId}/reservations`);
    return res.data?.data ?? res.data;
  },
});
