import { Controller, Get, Param } from '@nestjs/common';
import { CorporateAccountsService } from '../services/corporate-accounts.service';

@Controller('corporate-accounts')
export class CorporateAccountsController {
  constructor(private readonly corporateAccountsService: CorporateAccountsService) {}

  @Get()
  async findAll() {
    return this.corporateAccountsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.corporateAccountsService.findOne(id);
  }
}
