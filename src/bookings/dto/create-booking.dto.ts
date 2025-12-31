import { IsString, IsEmail, IsDateString, IsNumber, IsOptional, MinLength, IsEnum } from 'class-validator';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled'
}

export class CreateBookingDto {
  @IsString()
  service_id: string; // UUID

  @IsDateString()
  booking_date: string;

  @IsString()
  booking_time: string;

  @IsString()
  @MinLength(2)
  full_name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(10)
  phone: string;

  @IsString()
  @IsOptional()
  special_requests?: string;

  @IsNumber()
  @IsOptional()
  amount?: number;
}
