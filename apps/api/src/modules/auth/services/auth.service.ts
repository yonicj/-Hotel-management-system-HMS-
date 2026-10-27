import { Injectable } from '@nestjs/common';
import { AuthRepository } from '../repositories/auth.repository';

@Injectable()
export class AuthService {
  constructor(private readonly repository: AuthRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
