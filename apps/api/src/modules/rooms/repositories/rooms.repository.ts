import { Injectable } from '@nestjs/common';

@Injectable()
export class RoomsRepository {
  async findAll() {
    return [];
  }

  async findById(id: string) {
    return { id };
  }
}
