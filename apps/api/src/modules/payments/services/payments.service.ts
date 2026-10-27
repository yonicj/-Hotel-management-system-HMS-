import { Injectable } from '@nestjs/common';
import { PaymentsRepository } from '../repositories/payments.repository';

@Injectable()
export class PaymentsService {
  constructor(private readonly repository: PaymentsRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
