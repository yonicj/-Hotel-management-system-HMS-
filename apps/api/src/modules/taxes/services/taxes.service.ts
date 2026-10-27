import { Injectable } from '@nestjs/common';
import { TaxesRepository } from '../repositories/taxes.repository';

@Injectable()
export class TaxesService {
  constructor(private readonly repository: TaxesRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
