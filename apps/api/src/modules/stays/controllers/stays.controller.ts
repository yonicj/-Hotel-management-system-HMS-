import { Controller, Get, Param } from '@nestjs/common';
import { StaysService } from '../services/stays.service';

@Controller('stays')
export class StaysController {
  constructor(private readonly staysService: StaysService) {}

  @Get()
  async findAll() {
    return this.staysService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.staysService.findOne(id);
  }
}
