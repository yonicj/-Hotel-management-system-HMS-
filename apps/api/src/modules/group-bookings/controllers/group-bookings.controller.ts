import { Controller, Get, Param } from '@nestjs/common';
import { GroupBookingsService } from '../services/group-bookings.service';

@Controller('group-bookings')
export class GroupBookingsController {
  constructor(private readonly groupBookingsService: GroupBookingsService) {}

  @Get()
  async findAll() {
    return this.groupBookingsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.groupBookingsService.findOne(id);
  }
}
