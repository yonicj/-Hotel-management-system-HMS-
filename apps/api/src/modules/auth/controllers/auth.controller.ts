import { Controller, Get, Param } from '@nestjs/common';
import { AuthService } from '../services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  async findAll() {
    return this.authService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.authService.findOne(id);
  }
}
