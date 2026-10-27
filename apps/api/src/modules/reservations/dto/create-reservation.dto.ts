import { IsString, IsUUID, IsNumber, IsOptional } from 'class-validator';

export class CreateReservationDto {
  @IsUUID()
  propertyId: string;

  @IsUUID()
  guestId: string;

  @IsUUID()
  roomTypeId: string;

  @IsOptional()
  @IsUUID()
  roomId?: string;

  @IsString()
  checkInDate: string;

  @IsString()
  checkOutDate: string;

  @IsNumber()
  adultsCount: number;

  @IsOptional()
  @IsNumber()
  childrenCount?: number;

  @IsNumber()
  totalAmount: number;
}
