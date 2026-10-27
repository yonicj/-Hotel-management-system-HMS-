import { Injectable } from '@nestjs/common';
import { PurchasingRepository } from '../repositories/purchasing.repository';

@Injectable()
export class PurchasingService {
  constructor(private readonly repository: PurchasingRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
