import { IsInt, IsOptional, IsDateString } from 'class-validator';

export class CreateClassBookingDto {
  @IsInt()
  customer_id: number;

  @IsInt()
  schedule_id: number;

  @IsInt()
  service_id: number;

  @IsDateString()
  starts_on: string;

  @IsDateString()
  @IsOptional()
  ends_on?: string;
}
