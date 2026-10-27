import { Injectable } from '@nestjs/common';

@Injectable()
export class StaysRepository {
  async findAll() {
    return [];
  }

  async findById(id: string) {
    return { id };
  }
}
