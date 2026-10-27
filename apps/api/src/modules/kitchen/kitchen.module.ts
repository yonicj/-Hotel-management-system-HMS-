import { Module } from '@nestjs/common';
import { KitchenController } from './controllers/kitchen.controller';
import { KitchenService } from './services/kitchen.service';
import { KitchenRepository } from './repositories/kitchen.repository';

@Module({
  controllers: [KitchenController],
  providers: [KitchenService, KitchenRepository],
  exports: [KitchenService, KitchenRepository],
})
export class KitchenModule {}
