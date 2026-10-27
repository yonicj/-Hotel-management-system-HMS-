import { Module } from '@nestjs/common';
import { SyncController } from './controllers/sync.controller';
import { SyncService } from './services/sync.service';
import { SyncRepository } from './repositories/sync.repository';

@Module({
  controllers: [SyncController],
  providers: [SyncService, SyncRepository],
  exports: [SyncService, SyncRepository],
})
export class SyncModule {}
