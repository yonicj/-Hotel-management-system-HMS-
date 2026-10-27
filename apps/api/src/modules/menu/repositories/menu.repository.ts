import { Injectable } from '@nestjs/common';

@Injectable()
export class MenuRepository {
  async findAll() {
    return [];
  }

  async findById(id: string) {
    return { id };
  }
}
