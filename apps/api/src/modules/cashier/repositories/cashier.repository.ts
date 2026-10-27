import { Injectable } from '@nestjs/common';

@Injectable()
export class CashierRepository {
  async findAll() {
    return [];
  }

  async findById(id: string) {
    return { id };
  }
}
