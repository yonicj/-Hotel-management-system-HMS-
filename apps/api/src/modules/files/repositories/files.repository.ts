import { Injectable } from '@nestjs/common';

@Injectable()
export class FilesRepository {
  async findAll() {
    return [];
  }

  async findById(id: string) {
    return { id };
  }
}
