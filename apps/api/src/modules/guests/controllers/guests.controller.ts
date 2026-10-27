import { Controller, Get, Param } from '@nestjs/common';
import { GuestsService } from '../services/guests.service';

@Controller('guests')
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  @Get()
  async findAll() {
    return this.guestsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.guestsService.findOne(id);
  }
}
