import { Module } from '@nestjs/common';
import { LostFoundController } from './controllers/lost-found.controller';
import { LostFoundService } from './services/lost-found.service';
import { LostFoundRepository } from './repositories/lost-found.repository';

@Module({
  controllers: [LostFoundController],
  providers: [LostFoundService, LostFoundRepository],
  exports: [LostFoundService, LostFoundRepository],
})
export class LostFoundModule {}
