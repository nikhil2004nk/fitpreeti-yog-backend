export interface Review {
  id: string;
  user_id: number;
  booking_id?: string | null;
  rating: number;
  comment: string;
  reviewer_type?: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReviewWithUser extends Review {
  user_name?: string;
  user_profile_image?: string | null;
}

