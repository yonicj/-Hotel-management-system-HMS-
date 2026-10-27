import { Controller, Get, Param } from '@nestjs/common';
import { RoomTypesService } from '../services/room-types.service';

@Controller('room-types')
export class RoomTypesController {
  constructor(private readonly roomTypesService: RoomTypesService) {}

  @Get()
  async findAll() {
    return this.roomTypesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.roomTypesService.findOne(id);
  }
}
