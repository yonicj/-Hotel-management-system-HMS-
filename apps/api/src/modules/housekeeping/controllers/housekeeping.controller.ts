import { Controller, Get, Param } from '@nestjs/common';
import { HousekeepingService } from '../services/housekeeping.service';

@Controller('housekeeping')
export class HousekeepingController {
  constructor(private readonly housekeepingService: HousekeepingService) {}

  @Get()
  async findAll() {
    return this.housekeepingService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.housekeepingService.findOne(id);
  }
}
