import { api } from './api';

export const housekeepingService = {
  getTasks: (date?: string) =>
    api.get('/housekeeping/tasks', { params: { date } }).then((r) => r.data.data),

  createTask: (data: unknown) =>
    api.post('/housekeeping/tasks', data).then((r) => r.data.data),

  updateTaskStatus: (id: string, status: string, notes?: string) =>
    api.patch(`/housekeeping/tasks/${id}/status`, { status, notes }).then((r) => r.data.data),

  getBoard: () => api.get('/housekeeping/board').then((r) => r.data.data),
};
