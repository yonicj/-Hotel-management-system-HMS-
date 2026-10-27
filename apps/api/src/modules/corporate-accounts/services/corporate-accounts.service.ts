import { Injectable } from '@nestjs/common';
import { CorporateAccountsRepository } from '../repositories/corporate-accounts.repository';

@Injectable()
export class CorporateAccountsService {
  constructor(private readonly repository: CorporateAccountsRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
