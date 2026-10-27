import { Injectable } from '@nestjs/common';
import { RoomsRepository } from '../repositories/rooms.repository';

@Injectable()
export class RoomsService {
  constructor(private readonly repository: RoomsRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
