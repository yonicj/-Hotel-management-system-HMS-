import { Injectable } from '@nestjs/common';
import { InventoryRepository } from '../repositories/inventory.repository';

@Injectable()
export class InventoryService {
  constructor(private readonly repository: InventoryRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
