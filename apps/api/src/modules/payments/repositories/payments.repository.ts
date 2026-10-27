import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentsRepository {
  async findAll() {
    return [];
  }

  async findById(id: string) {
    return { id };
  }
}
