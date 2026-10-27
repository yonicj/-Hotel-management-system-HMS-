import { Injectable } from '@nestjs/common';

@Injectable()
export class OrganizationsRepository {
  async findAll() {
    return [];
  }

  async findById(id: string) {
    return { id };
  }
}
