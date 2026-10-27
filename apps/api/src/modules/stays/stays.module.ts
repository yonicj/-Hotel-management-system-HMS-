import { Module } from '@nestjs/common';
import { StaysController } from './controllers/stays.controller';
import { StaysService } from './services/stays.service';
import { StaysRepository } from './repositories/stays.repository';

@Module({
  controllers: [StaysController],
  providers: [StaysService, StaysRepository],
  exports: [StaysService, StaysRepository],
})
export class StaysModule {}
