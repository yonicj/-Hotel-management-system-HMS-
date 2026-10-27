import { Injectable } from '@nestjs/common';

@Injectable()
export class PermissionsRepository {
  async findAll() {
    return [];
  }

  async findById(id: string) {
    return { id };
  }
}
