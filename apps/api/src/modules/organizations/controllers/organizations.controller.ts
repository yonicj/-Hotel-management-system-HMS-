import { Controller, Get, Param } from '@nestjs/common';
import { OrganizationsService } from '../services/organizations.service';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  async findAll() {
    return this.organizationsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }
}
