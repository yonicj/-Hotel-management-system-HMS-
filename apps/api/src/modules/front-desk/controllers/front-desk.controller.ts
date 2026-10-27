import { Controller, Get, Param } from '@nestjs/common';
import { FrontDeskService } from '../services/front-desk.service';

@Controller('front-desk')
export class FrontDeskController {
  constructor(private readonly frontDeskService: FrontDeskService) {}

  @Get()
  async findAll() {
    return this.frontDeskService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.frontDeskService.findOne(id);
  }
}
