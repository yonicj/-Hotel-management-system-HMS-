import { Injectable } from '@nestjs/common';

@Injectable()
export class KitchenRepository {
  async findAll() {
    return [];
  }

  async findById(id: string) {
    return { id };
  }
}
