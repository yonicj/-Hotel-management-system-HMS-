import { Injectable } from '@nestjs/common';
import { HousekeepingRepository } from '../repositories/housekeeping.repository';

@Injectable()
export class HousekeepingService {
  constructor(private readonly repository: HousekeepingRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
