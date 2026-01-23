import { PartialType } from '@nestjs/mapped-types';
import { CreateBookingDto, BookingStatus } from './create-booking.dto';
import { IsOptional, IsEnum, IsString, IsNumber } from 'class-validator';
import { PaymentStatus } from '../entities/booking.entity';

export class UpdateBookingDto extends PartialType(CreateBookingDto) {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  payment_status?: PaymentStatus;

  @IsOptional()
  @IsString()
  payment_id?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
