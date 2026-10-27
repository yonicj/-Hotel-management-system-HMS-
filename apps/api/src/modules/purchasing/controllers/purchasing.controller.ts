import { Controller, Get, Param } from '@nestjs/common';
import { PurchasingService } from '../services/purchasing.service';

@Controller('purchasing')
export class PurchasingController {
  constructor(private readonly purchasingService: PurchasingService) {}

  @Get()
  async findAll() {
    return this.purchasingService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.purchasingService.findOne(id);
  }
}
