import { Injectable } from '@nestjs/common';
import { AvailabilityRepository } from '../repositories/availability.repository';

@Injectable()
export class AvailabilityService {
  constructor(private readonly repository: AvailabilityRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
