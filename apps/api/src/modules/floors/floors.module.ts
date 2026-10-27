import { Module } from '@nestjs/common';
import { FloorsController } from './controllers/floors.controller';
import { FloorsService } from './services/floors.service';
import { FloorsRepository } from './repositories/floors.repository';

@Module({
  controllers: [FloorsController],
  providers: [FloorsService, FloorsRepository],
  exports: [FloorsService, FloorsRepository],
})
export class FloorsModule {}
