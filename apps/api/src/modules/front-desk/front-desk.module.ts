import { Module } from '@nestjs/common';
import { FrontDeskController } from './controllers/front-desk.controller';
import { FrontDeskService } from './services/front-desk.service';
import { FrontDeskRepository } from './repositories/front-desk.repository';

@Module({
  controllers: [FrontDeskController],
  providers: [FrontDeskService, FrontDeskRepository],
  exports: [FrontDeskService, FrontDeskRepository],
})
export class FrontDeskModule {}
