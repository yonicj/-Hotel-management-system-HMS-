import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReservationsRepository } from '../repositories/reservations.repository';
import { CreateReservationDto } from '../dto/create-reservation.dto';
import { UpdateReservationDto } from '../dto/update-reservation.dto';
import { ReservationCreatedEvent } from '../../../events/reservation.events';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly repository: ReservationsRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateReservationDto) {
    const reservation = await this.repository.create(dto);
    this.eventEmitter.emit(
      'reservation.created',
      new ReservationCreatedEvent(reservation.id, reservation.guestId, reservation.propertyId, reservation.totalAmount)
    );
    return reservation;
  }

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    const reservation = await this.repository.findById(id);
    if (!reservation) throw new NotFoundException('Reservation not found');
    return reservation;
  }

  async update(id: string, dto: UpdateReservationDto) {
    return this.repository.update(id, dto);
  }
}
