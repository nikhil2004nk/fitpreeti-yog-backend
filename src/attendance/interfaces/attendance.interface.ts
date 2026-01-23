import { AttendanceStatus as AttendanceStatusEnum } from '../entities/attendance.entity';

export type AttendanceStatus = AttendanceStatusEnum;
export type UserRole = 'customer' | 'admin' | 'trainer';

// Enum values for use in decorators
export const AttendanceStatusEnumValues = ['present', 'absent', 'late', 'excused'] as const;
export const UserRoleEnum = ['customer', 'admin', 'trainer'] as const;

export interface Attendance {
  id: string; // UUID
  user_id: string; // UUID
  user_name?: string; // Name of the user (for display)
  user_role?: UserRole; // Role of the user
  date: string; // Date in YYYY-MM-DD format
  status: AttendanceStatus; // AttendanceStatus enum
  marked_by?: string | null; // User ID who marked the attendance (null if self-marked)
  marked_by_name?: string | null; // Name of the person who marked attendance
  notes?: string | null; // Optional notes
  created_at?: string; // ISO timestamp
  updated_at?: string; // ISO timestamp
}

export interface AttendanceStats {
  total_days: number; // Total days in the period
  present_days: number; // Number of present days
  absent_days: number; // Number of absent days
  attendance_percentage: number; // Percentage (0-100)
}

