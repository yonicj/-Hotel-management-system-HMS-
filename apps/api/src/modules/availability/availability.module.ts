import { Module } from '@nestjs/common';
import { AvailabilityController } from './controllers/availability.controller';
import { AvailabilityService } from './services/availability.service';
import { AvailabilityRepository } from './repositories/availability.repository';

@Module({
  controllers: [AvailabilityController],
  providers: [AvailabilityService, AvailabilityRepository],
  exports: [AvailabilityService, AvailabilityRepository],
})
export class AvailabilityModule {}
