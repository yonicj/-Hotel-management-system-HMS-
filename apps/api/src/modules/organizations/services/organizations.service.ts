import { Injectable } from '@nestjs/common';
import { OrganizationsRepository } from '../repositories/organizations.repository';

@Injectable()
export class OrganizationsService {
  constructor(private readonly repository: OrganizationsRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
