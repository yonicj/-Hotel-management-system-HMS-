import { Injectable } from '@nestjs/common';

@Injectable()
export class AmenitiesRepository {
  async findAll() {
    return [];
  }

  async findById(id: string) {
    return { id };
  }
}
