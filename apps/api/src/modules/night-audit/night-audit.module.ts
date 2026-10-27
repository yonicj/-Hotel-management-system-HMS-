import { Module } from '@nestjs/common';
import { NightAuditController } from './controllers/night-audit.controller';
import { NightAuditService } from './services/night-audit.service';
import { NightAuditRepository } from './repositories/night-audit.repository';

@Module({
  controllers: [NightAuditController],
  providers: [NightAuditService, NightAuditRepository],
  exports: [NightAuditService, NightAuditRepository],
})
export class NightAuditModule {}
