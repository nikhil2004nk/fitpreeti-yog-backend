import {
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsDateString,
  IsArray,
  MaxLength,
  Min,
} from 'class-validator';
import { RecurrenceType } from '../../common/enums/schedule.enums';

export class CreateScheduleDto {
  @IsInt()
  service_id: number;

  @IsInt()
  trainer_id: number;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsEnum(RecurrenceType)
  recurrence_type: RecurrenceType;

  @IsBoolean()
  @IsOptional()
  monday?: boolean;

  @IsBoolean()
  @IsOptional()
  tuesday?: boolean;

  @IsBoolean()
  @IsOptional()
  wednesday?: boolean;

  @IsBoolean()
  @IsOptional()
  thursday?: boolean;

  @IsBoolean()
  @IsOptional()
  friday?: boolean;

  @IsBoolean()
  @IsOptional()
  saturday?: boolean;

  @IsBoolean()
  @IsOptional()
  sunday?: boolean;

  @IsInt()
  @Min(1)
  @IsOptional()
  day_of_month?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  custom_dates?: string[];

  @IsString()
  start_time: string;

  @IsString()
  end_time: string;

  @IsDateString()
  effective_from: string;

  @IsDateString()
  @IsOptional()
  effective_until?: string;

  @IsInt()
  @Min(1)
  max_participants: number;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  location?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  meeting_link?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
