import { Injectable } from '@nestjs/common';
import { GroupBookingsRepository } from '../repositories/group-bookings.repository';

@Injectable()
export class GroupBookingsService {
  constructor(private readonly repository: GroupBookingsRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
