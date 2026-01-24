import {
  IsInt,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '../../common/enums/attendance.enums';

export class MarkAttendanceDto {
  @IsInt()
  customer_id: number;

  @IsInt()
  schedule_id: number;

  @IsInt()
  subscription_id: number;

  @IsDateString()
  attendance_date: string;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class MarkAttendanceItemDto {
  @IsInt()
  customer_id: number;

  @IsInt()
  subscription_id: number;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkMarkAttendanceDto {
  @IsInt()
  schedule_id: number;

  @IsDateString()
  attendance_date: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MarkAttendanceItemDto)
  marks: MarkAttendanceItemDto[];
}
