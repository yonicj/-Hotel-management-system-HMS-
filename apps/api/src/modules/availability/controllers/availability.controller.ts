import { Controller, Get, Param } from '@nestjs/common';
import { AvailabilityService } from '../services/availability.service';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  async findAll() {
    return this.availabilityService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.availabilityService.findOne(id);
  }
}
