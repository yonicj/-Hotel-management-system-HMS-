import { Module } from '@nestjs/common';
import { GuestsController } from './controllers/guests.controller';
import { GuestsService } from './services/guests.service';
import { GuestsRepository } from './repositories/guests.repository';

@Module({
  controllers: [GuestsController],
  providers: [GuestsService, GuestsRepository],
  exports: [GuestsService, GuestsRepository],
})
export class GuestsModule {}
