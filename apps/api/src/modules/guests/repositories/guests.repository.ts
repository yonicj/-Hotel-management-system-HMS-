import { Injectable } from '@nestjs/common';

@Injectable()
export class GuestsRepository {
  async findAll() {
    return [];
  }

  async findById(id: string) {
    return { id };
  }
}
