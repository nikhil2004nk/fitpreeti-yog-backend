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
import { Transform } from 'class-transformer';
import { RecurrenceType } from '../../common/enums/schedule.enums';

/** Coerce 0/1 to boolean for weekday flags. */
function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 1 || value === '1') return true;
  if (value === 0 || value === '0') return false;
  return !!value;
}

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

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  monday?: boolean;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  tuesday?: boolean;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  wednesday?: boolean;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  thursday?: boolean;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  friday?: boolean;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  saturday?: boolean;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
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
