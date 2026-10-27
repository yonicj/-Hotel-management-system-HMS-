import { Injectable } from '@nestjs/common';
import { SyncRepository } from '../repositories/sync.repository';

@Injectable()
export class SyncService {
  constructor(private readonly repository: SyncRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
