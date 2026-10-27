import { Injectable } from '@nestjs/common';

@Injectable()
export class HousekeepingRepository {
  async findAll() {
    return [];
  }

  async findById(id: string) {
    return { id };
  }
}
