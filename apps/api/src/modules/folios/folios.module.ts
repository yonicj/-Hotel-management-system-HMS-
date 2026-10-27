import { Module } from '@nestjs/common';
import { FoliosController } from './controllers/folios.controller';
import { FoliosService } from './services/folios.service';
import { FoliosRepository } from './repositories/folios.repository';

@Module({
  controllers: [FoliosController],
  providers: [FoliosService, FoliosRepository],
  exports: [FoliosService, FoliosRepository],
})
export class FoliosModule {}
