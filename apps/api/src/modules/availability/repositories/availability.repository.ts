import { Injectable } from '@nestjs/common';

@Injectable()
export class AvailabilityRepository {
  async findAll() {
    return [];
  }

  async findById(id: string) {
    return { id };
  }
}
