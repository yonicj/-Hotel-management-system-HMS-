import { Injectable } from '@nestjs/common';
import { AuditRepository } from '../repositories/audit.repository';

@Injectable()
export class AuditService {
  constructor(private readonly repository: AuditRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
