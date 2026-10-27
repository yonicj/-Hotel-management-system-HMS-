import { Injectable } from '@nestjs/common';

@Injectable()
export class AuditRepository {
  async findAll() {
    return [];
  }

  async findById(id: string) {
    return { id };
  }
}
