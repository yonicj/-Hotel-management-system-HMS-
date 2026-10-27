import { Module } from '@nestjs/common';
import { InvoicesController } from './controllers/invoices.controller';
import { InvoicesService } from './services/invoices.service';
import { InvoicesRepository } from './repositories/invoices.repository';

@Module({
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoicesRepository],
  exports: [InvoicesService, InvoicesRepository],
})
export class InvoicesModule {}
