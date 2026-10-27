import { Controller, Get, Param } from '@nestjs/common';
import { CashierService } from '../services/cashier.service';

@Controller('cashier')
export class CashierController {
  constructor(private readonly cashierService: CashierService) {}

  @Get()
  async findAll() {
    return this.cashierService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.cashierService.findOne(id);
  }
}
