import { Injectable } from '@nestjs/common';

@Injectable()
export class NightAuditRepository {
  async findAll() {
    return [];
  }

  async findById(id: string) {
    return { id };
  }
}
