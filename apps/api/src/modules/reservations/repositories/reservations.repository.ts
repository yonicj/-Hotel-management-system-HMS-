import { Injectable } from '@nestjs/common';

@Injectable()
export class ReservationsRepository {
  private reservations: any[] = [];

  async create(data: any) {
    const reservation = {
      id: `res-${Date.now()}`,
      bookingReference: `ET-${Math.floor(100000 + Math.random() * 900000)}`,
      ...data,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };
    this.reservations.push(reservation);
    return reservation;
  }

  async findAll() {
    return this.reservations;
  }

  async findById(id: string) {
    return this.reservations.find(r => r.id === id) || null;
  }

  async update(id: string, data: any) {
    const index = this.reservations.findIndex(r => r.id === id);
    if (index !== -1) {
      this.reservations[index] = { ...this.reservations[index], ...data };
      return this.reservations[index];
    }
    return null;
  }
}
