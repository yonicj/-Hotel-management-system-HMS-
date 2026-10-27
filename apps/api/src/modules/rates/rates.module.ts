import { Module } from '@nestjs/common';
import { RatesController } from './controllers/rates.controller';
import { RatesService } from './services/rates.service';
import { RatesRepository } from './repositories/rates.repository';

@Module({
  controllers: [RatesController],
  providers: [RatesService, RatesRepository],
  exports: [RatesService, RatesRepository],
})
export class RatesModule {}
