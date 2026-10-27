import { Injectable } from '@nestjs/common';
import { GuestsRepository } from '../repositories/guests.repository';

@Injectable()
export class GuestsService {
  constructor(private readonly repository: GuestsRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
