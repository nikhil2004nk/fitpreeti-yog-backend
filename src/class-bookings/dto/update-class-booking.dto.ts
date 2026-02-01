import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ClassBookingStatus } from '../entities/class-booking.entity';

export class UpdateClassBookingDto {
  @IsDateString()
  @IsOptional()
  starts_on?: string;

  @IsDateString()
  @IsOptional()
  ends_on?: string;

  @IsEnum(ClassBookingStatus)
  @IsOptional()
  status?: ClassBookingStatus;
}
