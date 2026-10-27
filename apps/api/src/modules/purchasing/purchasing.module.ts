import { Module } from '@nestjs/common';
import { PurchasingController } from './controllers/purchasing.controller';
import { PurchasingService } from './services/purchasing.service';
import { PurchasingRepository } from './repositories/purchasing.repository';

@Module({
  controllers: [PurchasingController],
  providers: [PurchasingService, PurchasingRepository],
  exports: [PurchasingService, PurchasingRepository],
})
export class PurchasingModule {}
