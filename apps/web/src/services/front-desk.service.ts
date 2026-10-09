import { api } from './api';

export const frontDeskService = {
  checkIn: (reservationId: string) =>
    api.post(`/front-desk/check-in/${reservationId}`).then((r) => r.data.data),

  checkOut: (reservationId: string) =>
    api.post(`/front-desk/check-out/${reservationId}`).then((r) => r.data.data),

  getArrivals: (date?: string) =>
    api.get('/front-desk/arrivals', { params: { date } }).then((r) => r.data.data),

  getDepartures: (date?: string) =>
    api.get('/front-desk/departures', { params: { date } }).then((r) => r.data.data),

  getInHouse: () => api.get('/front-desk/in-house').then((r) => r.data.data),

  getRoomRack: () => api.get('/front-desk/room-rack').then((r) => r.data.data),
};
