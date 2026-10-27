import { Controller, Get, Param } from '@nestjs/common';
import { RatesService } from '../services/rates.service';

@Controller('rates')
export class RatesController {
  constructor(private readonly ratesService: RatesService) {}

  @Get()
  async findAll() {
    return this.ratesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.ratesService.findOne(id);
  }
}
