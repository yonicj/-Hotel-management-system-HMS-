import { Injectable } from '@nestjs/common';
import { LostFoundRepository } from '../repositories/lost-found.repository';

@Injectable()
export class LostFoundService {
  constructor(private readonly repository: LostFoundRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
