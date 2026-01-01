import { IsArray, IsString, IsEnum, IsOptional, IsUUID, Matches, ArrayMinSize } from 'class-validator';
import type { AttendanceStatus } from '../interfaces/attendance.interface';

export class BulkCreateAttendanceDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  user_ids: string[]; // Required: Array of user IDs

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' })
  date: string; // Required: Date in YYYY-MM-DD format

  @IsEnum(['present', 'absent'])
  status: AttendanceStatus; // Required: Attendance status

  @IsString()
  @IsOptional()
  notes?: string; // Optional: Notes
}

