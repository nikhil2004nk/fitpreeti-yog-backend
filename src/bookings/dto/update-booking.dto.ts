import { PartialType } from '@nestjs/mapped-types';
import { CreateBookingDto, BookingStatus } from './create-booking.dto';
import { IsOptional, IsEnum } from 'class-validator';

export class UpdateBookingDto extends PartialType(CreateBookingDto) {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
}
