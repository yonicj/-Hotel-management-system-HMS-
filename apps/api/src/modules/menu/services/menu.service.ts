import { Injectable } from '@nestjs/common';
import { MenuRepository } from '../repositories/menu.repository';

@Injectable()
export class MenuService {
  constructor(private readonly repository: MenuRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findById(id);
  }
}
