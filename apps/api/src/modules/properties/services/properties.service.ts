import { Injectable } from '@nestjs/common';
import { PropertiesRepository } from '../repositories/properties.repository';

@Injectable()
export class PropertiesService {
  constructor(private readonly repository: PropertiesRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
