import { Module } from '@nestjs/common';
import { ReservationsController } from './controllers/reservations.controller';
import { ReservationsService } from './services/reservations.service';
import { AvailabilityService } from './services/availability.service';
import { ReservationsRepository } from './repositories/reservations.repository';

@Module({
  controllers: [ReservationsController],
  providers: [ReservationsService, AvailabilityService, ReservationsRepository],
  exports: [ReservationsService, AvailabilityService, ReservationsRepository],
})
export class ReservationsModule {}
