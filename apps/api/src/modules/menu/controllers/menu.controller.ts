import { Controller, Get, Param } from '@nestjs/common';
import { MenuService } from '../services/menu.service';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  async findAll() {
    return this.menuService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.menuService.findOne(id);
  }
}
