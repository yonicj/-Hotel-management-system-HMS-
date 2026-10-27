import { Controller, Get, Param } from '@nestjs/common';
import { PosService } from '../services/pos.service';

@Controller('pos')
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Get()
  async findAll() {
    return this.posService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.posService.findOne(id);
  }
}
