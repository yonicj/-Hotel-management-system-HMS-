import { IsString, IsUUID } from 'class-validator';

export class SearchAvailabilityDto {
  @IsUUID()
  propertyId: string;

  @IsString()
  checkInDate: string;

  @IsString()
  checkOutDate: string;
}
