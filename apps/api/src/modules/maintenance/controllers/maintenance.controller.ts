import { Controller, Get, Param } from '@nestjs/common';
import { MaintenanceService } from '../services/maintenance.service';

@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get()
  async findAll() {
    return this.maintenanceService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.maintenanceService.findOne(id);
  }
}
