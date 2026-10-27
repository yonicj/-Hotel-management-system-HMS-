import { Injectable } from '@nestjs/common';
import { NightAuditRepository } from '../repositories/night-audit.repository';

@Injectable()
export class NightAuditService {
  constructor(private readonly repository: NightAuditRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
