import { api } from './api';

export const reservationsService = {
  getAll: (params?: Record<string, unknown>) =>
    api.get('/reservations', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get(`/reservations/${id}`).then((r) => r.data.data),

  create: (data: unknown) =>
    api.post('/reservations', data).then((r) => r.data.data),

  confirm: (id: string) =>
    api.patch(`/reservations/${id}/confirm`).then((r) => r.data.data),

  cancel: (id: string) =>
    api.delete(`/reservations/${id}`).then((r) => r.data.data),

  assignRoom: (id: string, roomId: string) =>
    api.patch(`/reservations/${id}/assign-room`, { roomId }).then((r) => r.data.data),
};
