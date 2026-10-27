import { Injectable } from '@nestjs/common';

@Injectable()
export class ReportsRepository {
  async findAll() {
    return [];
  }

  async findById(id: string) {
    return { id };
  }
}
