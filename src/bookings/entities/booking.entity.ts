import type { User } from '../../users/entities/user.entity';
import type { Service } from '../../services/entities/service.entity';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show'
}

export interface Booking {
  id: string;
  user_id: string;
  user?: User;
  service_id: string;
  service?: Service;
  start_time: Date;
  end_time: Date;
  status: BookingStatus;
  notes: string | null;
  amount: number;
  created_at: Date;
  updated_at: Date;
  payment_status: string;
  payment_id: string | null;
  cancellation_reason: string | null;
}