import { Module } from '@nestjs/common';
import { CorporateAccountsController } from './controllers/corporate-accounts.controller';
import { CorporateAccountsService } from './services/corporate-accounts.service';
import { CorporateAccountsRepository } from './repositories/corporate-accounts.repository';

@Module({
  controllers: [CorporateAccountsController],
  providers: [CorporateAccountsService, CorporateAccountsRepository],
  exports: [CorporateAccountsService, CorporateAccountsRepository],
})
export class CorporateAccountsModule {}
