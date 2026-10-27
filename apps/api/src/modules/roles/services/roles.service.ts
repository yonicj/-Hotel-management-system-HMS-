import { Injectable } from '@nestjs/common';
import { RolesRepository } from '../repositories/roles.repository';

@Injectable()
export class RolesService {
  constructor(private readonly repository: RolesRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
