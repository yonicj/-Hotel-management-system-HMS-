import { Injectable } from '@nestjs/common';

@Injectable()
export class GroupBookingsRepository {
  async findAll() {
    return [];
  }

  async findById(id: string) {
    return { id };
  }
}
