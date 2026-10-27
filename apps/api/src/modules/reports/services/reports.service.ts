import { Injectable } from '@nestjs/common';
import { ReportsRepository } from '../repositories/reports.repository';

@Injectable()
export class ReportsService {
  constructor(private readonly repository: ReportsRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
