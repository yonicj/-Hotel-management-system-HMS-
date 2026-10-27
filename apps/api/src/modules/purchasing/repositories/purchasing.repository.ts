import { Injectable } from '@nestjs/common';

@Injectable()
export class PurchasingRepository {
  async findAll() {
    return [];
  }

  async findById(id: string) {
    return { id };
  }
}
