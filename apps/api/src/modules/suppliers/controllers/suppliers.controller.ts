import { Controller, Get, Param } from '@nestjs/common';
import { SuppliersService } from '../services/suppliers.service';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  async findAll() {
    return this.suppliersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.suppliersService.findOne(id);
  }
}
