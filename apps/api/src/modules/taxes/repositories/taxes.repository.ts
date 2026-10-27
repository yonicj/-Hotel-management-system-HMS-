import { Injectable } from '@nestjs/common';

@Injectable()
export class TaxesRepository {
  async findAll() {
    return [];
  }

  async findById(id: string) {
    return { id };
  }
}
