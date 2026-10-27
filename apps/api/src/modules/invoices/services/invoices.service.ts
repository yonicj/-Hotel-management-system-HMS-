import { Injectable } from '@nestjs/common';
import { InvoicesRepository } from '../repositories/invoices.repository';

@Injectable()
export class InvoicesService {
  constructor(private readonly repository: InvoicesRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
