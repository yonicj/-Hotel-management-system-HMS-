import { Module } from '@nestjs/common';
import { TaxesController } from './controllers/taxes.controller';
import { TaxesService } from './services/taxes.service';
import { TaxesRepository } from './repositories/taxes.repository';

@Module({
  controllers: [TaxesController],
  providers: [TaxesService, TaxesRepository],
  exports: [TaxesService, TaxesRepository],
})
export class TaxesModule {}
