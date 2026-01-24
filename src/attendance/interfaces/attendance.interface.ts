import { AttendanceStatus } from '../../common/enums/attendance.enums';

export type { AttendanceStatus };

export const AttendanceStatusEnumValues = ['present', 'absent', 'late', 'cancelled', 'holiday'] as const;

export interface AttendanceRecord {
  id: number;
  customer_id: number;
  schedule_id: number;
  subscription_id: number;
  attendance_date: string;
  status: AttendanceStatus;
  marked_by?: number | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceStats {
  total_days: number;
  present_days: number;
  absent_days: number;
  attendance_percentage: number;
}
