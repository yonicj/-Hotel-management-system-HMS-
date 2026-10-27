import { Injectable } from '@nestjs/common';
import { RatesRepository } from '../repositories/rates.repository';

@Injectable()
export class RatesService {
  constructor(private readonly repository: RatesRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
