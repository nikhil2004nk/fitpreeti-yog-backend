import { IsString, IsEnum, IsOptional, IsUUID, Matches } from 'class-validator';
import type { AttendanceStatus } from '../interfaces/attendance.interface';

export class CreateAttendanceDto {
  @IsUUID()
  @IsOptional()
  user_id?: string; // Optional: if not provided, will use authenticated user's ID

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' })
  date: string; // Required: Date in YYYY-MM-DD format

  @IsEnum(['present', 'absent'])
  status: AttendanceStatus; // Required: Attendance status

  @IsString()
  @IsOptional()
  notes?: string; // Optional: Notes
}

