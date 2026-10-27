import { Injectable } from '@nestjs/common';

@Injectable()
export class DevicesRepository {
  async findAll() {
    return [];
  }

  async findById(id: string) {
    return { id };
  }
}
