import { Module } from '@nestjs/common';
import { AmenitiesController } from './controllers/amenities.controller';
import { AmenitiesService } from './services/amenities.service';
import { AmenitiesRepository } from './repositories/amenities.repository';

@Module({
  controllers: [AmenitiesController],
  providers: [AmenitiesService, AmenitiesRepository],
  exports: [AmenitiesService, AmenitiesRepository],
})
export class AmenitiesModule {}
