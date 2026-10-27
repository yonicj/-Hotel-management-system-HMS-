import { Injectable } from '@nestjs/common';

@Injectable()
export class FoliosRepository {
  async findAll() {
    return [];
  }

  async findById(id: string) {
    return { id };
  }
}
