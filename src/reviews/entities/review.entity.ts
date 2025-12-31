import type { User } from '../../users/entities/user.entity';

export interface Review {
  id: string;
  user_id: string;
  user?: User;
  booking_id?: string | null;
  rating: number; // 1-5
  comment: string;
  reviewer_type?: string | null; // e.g., "Zumba Regular", "Yoga Regular", etc.
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

