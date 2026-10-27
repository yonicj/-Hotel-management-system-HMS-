import { Module } from '@nestjs/common';
import { PropertiesController } from './controllers/properties.controller';
import { PropertiesService } from './services/properties.service';
import { PropertiesRepository } from './repositories/properties.repository';

@Module({
  controllers: [PropertiesController],
  providers: [PropertiesService, PropertiesRepository],
  exports: [PropertiesService, PropertiesRepository],
})
export class PropertiesModule {}
