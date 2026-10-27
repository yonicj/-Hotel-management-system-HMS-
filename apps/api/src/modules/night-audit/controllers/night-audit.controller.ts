import { Controller, Get, Param } from '@nestjs/common';
import { NightAuditService } from '../services/night-audit.service';

@Controller('night-audit')
export class NightAuditController {
  constructor(private readonly nightAuditService: NightAuditService) {}

  @Get()
  async findAll() {
    return this.nightAuditService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.nightAuditService.findOne(id);
  }
}
