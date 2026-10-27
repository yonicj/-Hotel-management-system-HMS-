import { Injectable } from '@nestjs/common';
import { FrontDeskRepository } from '../repositories/front-desk.repository';

@Injectable()
export class FrontDeskService {
  constructor(private readonly repository: FrontDeskRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
