import { api } from './api';

export const billingService = {
  getFolio: (id: string) => api.get(`/billing/${id}`).then((r) => r.data.data),

  addCharge: (folioId: string, data: unknown) =>
    api.post(`/billing/${folioId}/charges`, data).then((r) => r.data.data),

  deleteCharge: (folioId: string, chargeId: string) =>
    api.delete(`/billing/${folioId}/charges/${chargeId}`),

  addPayment: (folioId: string, data: unknown) =>
    api.post(`/billing/${folioId}/payments`, data).then((r) => r.data.data),

  closeFolio: (id: string) =>
    api.post(`/billing/${id}/close`).then((r) => r.data.data),

  getInvoice: (id: string) =>
    api.get(`/billing/${id}/invoice`).then((r) => r.data.data),
};
