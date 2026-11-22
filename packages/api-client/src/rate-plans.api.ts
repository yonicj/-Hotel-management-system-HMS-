import { AxiosInstance } from 'axios';
import { RoomTypeItem } from './room-types.api';

export interface RatePlanItem {
  id: string;
  hotelId: string;
  roomTypeId: string;
  name: string;
  rate: number | string;
  startDate: string;
  endDate: string;
  minStay: number;
  isActive: boolean;
  roomType?: RoomTypeItem;
}

export interface CreateRatePlanInput {
  roomTypeId: string;
  name: string;
  rate: number;
  startDate: string;
  endDate: string;
  minStay?: number;
  isActive?: boolean;
}

export interface UpdateRatePlanInput {
  roomTypeId?: string;
  name?: string;
  rate?: number;
  startDate?: string;
  endDate?: string;
  minStay?: number;
  isActive?: boolean;
}

export const createRatePlansApi = (client: AxiosInstance) => ({
  getAll: async (): Promise<RatePlanItem[]> => {
    const res = await client.get('/rate-plans');
    return res.data?.data ?? res.data;
  },
  create: async (data: CreateRatePlanInput): Promise<RatePlanItem> => {
    const res = await client.post('/rate-plans', data);
    return res.data?.data ?? res.data;
  },
  update: async (id: string, data: UpdateRatePlanInput): Promise<RatePlanItem> => {
    const res = await client.put(`/rate-plans/${id}`, data);
    return res.data?.data ?? res.data;
  },
  compute: async (roomTypeId: string, checkIn: string, checkOut: string): Promise<any> => {
    const res = await client.get('/rate-plans/compute', {
      params: { room_type_id: roomTypeId, check_in: checkIn, check_out: checkOut },
    });
    return res.data?.data ?? res.data;
  },
});
