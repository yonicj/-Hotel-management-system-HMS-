import { Controller, Get, Param } from '@nestjs/common';
import { AuditService } from '../services/audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async findAll() {
    return this.auditService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.auditService.findOne(id);
  }
}
