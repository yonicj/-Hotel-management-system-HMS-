import { Injectable } from '@nestjs/common';
import { MaintenanceRepository } from '../repositories/maintenance.repository';

@Injectable()
export class MaintenanceService {
  constructor(private readonly repository: MaintenanceRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
