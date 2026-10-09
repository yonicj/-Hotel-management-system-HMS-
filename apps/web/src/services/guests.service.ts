import { api } from './api';

export const guestsService = {
  getAll: (params?: Record<string, unknown>) =>
    api.get('/guests', { params }).then((r) => r.data),

  getById: (id: string) => api.get(`/guests/${id}`).then((r) => r.data.data),

  create: (data: unknown) => api.post('/guests', data).then((r) => r.data.data),

  update: (id: string, data: unknown) =>
    api.put(`/guests/${id}`, data).then((r) => r.data.data),

  getReservations: (id: string) =>
    api.get(`/guests/${id}/reservations`).then((r) => r.data.data),
};
