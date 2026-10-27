import { Injectable } from '@nestjs/common';
import { RoomTypesRepository } from '../repositories/room-types.repository';

@Injectable()
export class RoomTypesService {
  constructor(private readonly repository: RoomTypesRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
