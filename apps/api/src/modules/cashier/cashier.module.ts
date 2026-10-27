import { Module } from '@nestjs/common';
import { CashierController } from './controllers/cashier.controller';
import { CashierService } from './services/cashier.service';
import { CashierRepository } from './repositories/cashier.repository';

@Module({
  controllers: [CashierController],
  providers: [CashierService, CashierRepository],
  exports: [CashierService, CashierRepository],
})
export class CashierModule {}
