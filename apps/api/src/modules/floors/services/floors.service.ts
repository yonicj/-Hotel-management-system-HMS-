import { Injectable } from '@nestjs/common';
import { FloorsRepository } from '../repositories/floors.repository';

@Injectable()
export class FloorsService {
  constructor(private readonly repository: FloorsRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
