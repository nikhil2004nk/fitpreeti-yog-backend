import { IsString, IsEnum, IsOptional } from 'class-validator';
import type { AttendanceStatus } from '../interfaces/attendance.interface';

export class UpdateAttendanceDto {
  @IsEnum(['present', 'absent'])
  @IsOptional()
  status?: AttendanceStatus; // Optional: New status

  @IsString()
  @IsOptional()
  notes?: string; // Optional: Updated notes
}

