import { Injectable } from '@nestjs/common';

@Injectable()
export class InvoicesRepository {
  async findAll() {
    return [];
  }

  async findById(id: string) {
    return { id };
  }
}
