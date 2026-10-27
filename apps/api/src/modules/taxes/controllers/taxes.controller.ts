import { Controller, Get, Param } from '@nestjs/common';
import { TaxesService } from '../services/taxes.service';

@Controller('taxes')
export class TaxesController {
  constructor(private readonly taxesService: TaxesService) {}

  @Get()
  async findAll() {
    return this.taxesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.taxesService.findOne(id);
  }
}
