import { Controller, Get, Param } from '@nestjs/common';
import { AmenitiesService } from '../services/amenities.service';

@Controller('amenities')
export class AmenitiesController {
  constructor(private readonly amenitiesService: AmenitiesService) {}

  @Get()
  async findAll() {
    return this.amenitiesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.amenitiesService.findOne(id);
  }
}
