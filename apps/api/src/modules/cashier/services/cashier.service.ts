import { Injectable } from '@nestjs/common';
import { CashierRepository } from '../repositories/cashier.repository';

@Injectable()
export class CashierService {
  constructor(private readonly repository: CashierRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
