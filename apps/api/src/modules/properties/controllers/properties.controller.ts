import { Controller, Get, Param } from '@nestjs/common';
import { PropertiesService } from '../services/properties.service';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  async findAll() {
    return this.propertiesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }
}
