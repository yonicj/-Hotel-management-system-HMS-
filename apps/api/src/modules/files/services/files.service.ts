import { Injectable } from '@nestjs/common';
import { FilesRepository } from '../repositories/files.repository';

@Injectable()
export class FilesService {
  constructor(private readonly repository: FilesRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
