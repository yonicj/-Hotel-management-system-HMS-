import { Controller, Get, Param } from '@nestjs/common';
import { InvoicesService } from '../services/invoices.service';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  async findAll() {
    return this.invoicesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }
}
