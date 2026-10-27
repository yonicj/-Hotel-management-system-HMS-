import { Controller, Get, Param } from '@nestjs/common';
import { NotificationsService } from '../services/notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll() {
    return this.notificationsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }
}
