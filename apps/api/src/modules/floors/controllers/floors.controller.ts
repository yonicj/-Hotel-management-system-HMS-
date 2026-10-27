import { Controller, Get, Param } from '@nestjs/common';
import { FloorsService } from '../services/floors.service';

@Controller('floors')
export class FloorsController {
  constructor(private readonly floorsService: FloorsService) {}

  @Get()
  async findAll() {
    return this.floorsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.floorsService.findOne(id);
  }
}
