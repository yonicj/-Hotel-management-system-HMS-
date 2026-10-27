import { Injectable } from '@nestjs/common';
import { NotificationsRepository } from '../repositories/notifications.repository';

@Injectable()
export class NotificationsService {
  constructor(private readonly repository: NotificationsRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
