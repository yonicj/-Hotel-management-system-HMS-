import { Module } from '@nestjs/common';
import { PosController } from './controllers/pos.controller';
import { PosService } from './services/pos.service';
import { PosRepository } from './repositories/pos.repository';

@Module({
  controllers: [PosController],
  providers: [PosService, PosRepository],
  exports: [PosService, PosRepository],
})
export class PosModule {}
