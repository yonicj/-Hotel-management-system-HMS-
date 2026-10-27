import { Module } from '@nestjs/common';
import { HousekeepingController } from './controllers/housekeeping.controller';
import { HousekeepingService } from './services/housekeeping.service';
import { HousekeepingRepository } from './repositories/housekeeping.repository';

@Module({
  controllers: [HousekeepingController],
  providers: [HousekeepingService, HousekeepingRepository],
  exports: [HousekeepingService, HousekeepingRepository],
})
export class HousekeepingModule {}
