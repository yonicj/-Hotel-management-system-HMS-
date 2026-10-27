import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersRepository {
  async findAll() {
    return [];
  }

  async findById(id: string) {
    return { id };
  }
}
