import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthRepository {
  async findAll() {
    return [];
  }

  async findById(id: string) {
    return { id };
  }
}
