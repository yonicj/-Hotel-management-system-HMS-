import { api } from './api';

export const reportsService = {
  getOccupancy: (from: string, to: string) =>
    api.get('/reports/occupancy', { params: { from, to } }).then((r) => r.data.data),

  getRevenue: (from: string, to: string) =>
    api.get('/reports/revenue', { params: { from, to } }).then((r) => r.data.data),

  getArrivalsDepartures: (date?: string) =>
    api.get('/reports/arrivals-departures', { params: { date } }).then((r) => r.data.data),

  getHousekeepingSummary: (date?: string) =>
    api.get('/reports/housekeeping-summary', { params: { date } }).then((r) => r.data.data),

  getGuestLedger: () =>
    api.get('/reports/guest-ledger').then((r) => r.data.data),
};
