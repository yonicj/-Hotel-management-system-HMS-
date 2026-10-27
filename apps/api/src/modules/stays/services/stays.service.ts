import { Injectable } from '@nestjs/common';
import { StaysRepository } from '../repositories/stays.repository';

@Injectable()
export class StaysService {
  constructor(private readonly repository: StaysRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
