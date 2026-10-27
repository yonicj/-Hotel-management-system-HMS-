import { Injectable } from '@nestjs/common';

@Injectable()
export class SyncRepository {
  async findAll() {
    return [];
  }

  async findById(id: string) {
    return { id };
  }
}
