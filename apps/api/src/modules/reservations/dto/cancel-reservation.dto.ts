import { IsString } from 'class-validator';

export class CancelReservationDto {
  @IsString()
  cancellationReason: string;
}
