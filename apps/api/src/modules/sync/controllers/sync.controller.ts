import { Controller, Get, Param } from '@nestjs/common';
import { SyncService } from '../services/sync.service';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get()
  async findAll() {
    return this.syncService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.syncService.findOne(id);
  }
}
