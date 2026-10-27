import { Injectable } from '@nestjs/common';
import { AmenitiesRepository } from '../repositories/amenities.repository';

@Injectable()
export class AmenitiesService {
  constructor(private readonly repository: AmenitiesRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
