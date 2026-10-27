import { Injectable } from '@nestjs/common';

@Injectable()
export class LostFoundRepository {
  async findAll() {
    return [];
  }

  async findById(id: string) {
    return { id };
  }
}
