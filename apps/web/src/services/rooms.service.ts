import { api } from './api';

export const roomsService = {
  getAll: () => api.get('/rooms').then((r) => r.data.data),

  getAvailability: (params: { check_in: string; check_out: string; room_type_id?: string }) =>
    api.get('/rooms/availability', { params }).then((r) => r.data.data),

  getById: (id: string) => api.get(`/rooms/${id}`).then((r) => r.data.data),

  create: (data: unknown) => api.post('/rooms', data).then((r) => r.data.data),

  updateStatus: (id: string, status: string, notes?: string) =>
    api.put(`/rooms/${id}/status`, { status, notes }).then((r) => r.data.data),
};
