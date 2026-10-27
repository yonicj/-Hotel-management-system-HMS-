import { Injectable } from '@nestjs/common';

@Injectable()
export class PosRepository {
  async findAll() {
    return [];
  }

  async findById(id: string) {
    return { id };
  }
}
