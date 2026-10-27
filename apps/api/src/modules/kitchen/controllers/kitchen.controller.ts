import { Controller, Get, Param } from '@nestjs/common';
import { KitchenService } from '../services/kitchen.service';

@Controller('kitchen')
export class KitchenController {
  constructor(private readonly kitchenService: KitchenService) {}

  @Get()
  async findAll() {
    return this.kitchenService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.kitchenService.findOne(id);
  }
}
