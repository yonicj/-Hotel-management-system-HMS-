import { Injectable } from '@nestjs/common';

@Injectable()
export class CorporateAccountsRepository {
  async findAll() {
    return [];
  }

  async findById(id: string) {
    return { id };
  }
}
