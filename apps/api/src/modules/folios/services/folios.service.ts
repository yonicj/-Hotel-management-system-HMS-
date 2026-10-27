import { Injectable } from '@nestjs/common';
import { FoliosRepository } from '../repositories/folios.repository';

@Injectable()
export class FoliosService {
  constructor(private readonly repository: FoliosRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
