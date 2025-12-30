import type { User } from '../../users/entities/user.entity';
import type { Trainer } from '../../trainers/entities/trainer.entity';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show'
}

export enum ServiceType {
  YOGA = 'yoga',
  MEDITATION = 'meditation',
  WORKSHOP = 'workshop',
  CLASS = 'class'
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  type: ServiceType;
  duration_minutes: number;
  trainer_id: string;
  trainer?: Trainer;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  category?: string;
  image_url?: string | null;
  bookings?: Booking[];
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