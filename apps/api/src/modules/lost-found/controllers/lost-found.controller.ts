import { Controller, Get, Param } from '@nestjs/common';
import { LostFoundService } from '../services/lost-found.service';

@Controller('lost-found')
export class LostFoundController {
  constructor(private readonly lostFoundService: LostFoundService) {}

  @Get()
  async findAll() {
    return this.lostFoundService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.lostFoundService.findOne(id);
  }
}
