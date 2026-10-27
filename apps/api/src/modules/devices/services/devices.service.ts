import { Injectable } from '@nestjs/common';
import { DevicesRepository } from '../repositories/devices.repository';

@Injectable()
export class DevicesService {
  constructor(private readonly repository: DevicesRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
