import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ReservationsService } from '../services/reservations.service';
import { AvailabilityService } from '../services/availability.service';
import { CreateReservationDto } from '../dto/create-reservation.dto';
import { UpdateReservationDto } from '../dto/update-reservation.dto';
import { SearchAvailabilityDto } from '../dto/search-availability.dto';

@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
    private readonly availabilityService: AvailabilityService,
  ) {}

  @Get('availability')
  async checkAvailability(@Query() query: SearchAvailabilityDto) {
    return this.availabilityService.checkAvailability(query);
  }

  @Post()
  async create(@Body() dto: CreateReservationDto) {
    return this.reservationsService.create(dto);
  }

  @Get()
  async findAll() {
    return this.reservationsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.reservationsService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateReservationDto) {
    return this.reservationsService.update(id, dto);
  }
}
