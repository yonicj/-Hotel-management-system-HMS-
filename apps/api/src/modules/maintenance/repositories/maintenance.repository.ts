import { Injectable } from '@nestjs/common';

@Injectable()
export class MaintenanceRepository {
  async findAll() {
    return [];
  }

  async findById(id: string) {
    return { id };
  }
}
