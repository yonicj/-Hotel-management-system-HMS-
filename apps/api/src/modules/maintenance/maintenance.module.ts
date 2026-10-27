import { Module } from '@nestjs/common';
import { MaintenanceController } from './controllers/maintenance.controller';
import { MaintenanceService } from './services/maintenance.service';
import { MaintenanceRepository } from './repositories/maintenance.repository';

@Module({
  controllers: [MaintenanceController],
  providers: [MaintenanceService, MaintenanceRepository],
  exports: [MaintenanceService, MaintenanceRepository],
})
export class MaintenanceModule {}
