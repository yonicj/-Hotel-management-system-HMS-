import { Injectable } from '@nestjs/common';

@Injectable()
export class FloorsRepository {
  async findAll() {
    return [];
  }

  async findById(id: string) {
    return { id };
  }
}
