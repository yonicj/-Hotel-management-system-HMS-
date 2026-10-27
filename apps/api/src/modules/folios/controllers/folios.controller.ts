import { Controller, Get, Param } from '@nestjs/common';
import { FoliosService } from '../services/folios.service';

@Controller('folios')
export class FoliosController {
  constructor(private readonly foliosService: FoliosService) {}

  @Get()
  async findAll() {
    return this.foliosService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.foliosService.findOne(id);
  }
}
