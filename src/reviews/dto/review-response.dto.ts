export class ReviewResponseDto {
  id: string;
  user_id: string;
  user_name?: string;
  user_profile_image?: string | null;
  booking_id?: string | null;
  rating: number;
  comment: string;
  reviewer_type?: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

