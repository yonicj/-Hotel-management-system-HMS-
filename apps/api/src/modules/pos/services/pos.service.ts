import { Injectable } from '@nestjs/common';
import { PosRepository } from '../repositories/pos.repository';

@Injectable()
export class PosService {
  constructor(private readonly repository: PosRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
