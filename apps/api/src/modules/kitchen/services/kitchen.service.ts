import { Injectable } from '@nestjs/common';
import { KitchenRepository } from '../repositories/kitchen.repository';

@Injectable()
export class KitchenService {
  constructor(private readonly repository: KitchenRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
