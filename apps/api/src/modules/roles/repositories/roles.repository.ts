import { Injectable } from '@nestjs/common';

@Injectable()
export class RolesRepository {
  async findAll() {
    return [];
  }

  async findById(id: string) {
    return { id };
  }
}
