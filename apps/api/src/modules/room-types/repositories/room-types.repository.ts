import { Injectable } from '@nestjs/common';

@Injectable()
export class RoomTypesRepository {
  async findAll() {
    return [];
  }

  async findById(id: string) {
    return { id };
  }
}
