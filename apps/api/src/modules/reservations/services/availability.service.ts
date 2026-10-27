import { Injectable } from '@nestjs/common';
import { SearchAvailabilityDto } from '../dto/search-availability.dto';

@Injectable()
export class AvailabilityService {
  async checkAvailability(query: SearchAvailabilityDto) {
    return {
      propertyId: query.propertyId,
      checkInDate: query.checkInDate,
      checkOutDate: query.checkOutDate,
      availableRoomTypes: [
        { roomTypeId: 'standard', name: 'Standard King', availableUnits: 12, rate: 2500 },
        { roomTypeId: 'deluxe', name: 'Deluxe Suite', availableUnits: 5, rate: 4500 }
      ]
    };
  }
}
