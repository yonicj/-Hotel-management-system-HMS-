import { Injectable } from '@nestjs/common';

@Injectable()
export class PropertiesRepository {
  async findAll() {
    return [];
  }

  async findById(id: string) {
    return { id };
  }
}
