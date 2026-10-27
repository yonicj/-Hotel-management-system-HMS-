import { Module } from '@nestjs/common';
import { GroupBookingsController } from './controllers/group-bookings.controller';
import { GroupBookingsService } from './services/group-bookings.service';
import { GroupBookingsRepository } from './repositories/group-bookings.repository';

@Module({
  controllers: [GroupBookingsController],
  providers: [GroupBookingsService, GroupBookingsRepository],
  exports: [GroupBookingsService, GroupBookingsRepository],
})
export class GroupBookingsModule {}
