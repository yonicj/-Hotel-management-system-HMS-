import { Injectable } from '@nestjs/common';
import { SuppliersRepository } from '../repositories/suppliers.repository';

@Injectable()
export class SuppliersService {
  constructor(private readonly repository: SuppliersRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
