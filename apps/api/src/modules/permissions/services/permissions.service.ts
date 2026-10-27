import { Injectable } from '@nestjs/common';
import { PermissionsRepository } from '../repositories/permissions.repository';

@Injectable()
export class PermissionsService {
  constructor(private readonly repository: PermissionsRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
