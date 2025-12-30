import { TrainerSpecialization } from '../enums/trainer-specialization.enum';

export interface Trainer {
  id: string;
  name: string;
  bio: string | null;
  specializations: string[];
  profile_image: string | null;
  rating: number;
  total_reviews: number;
  availability: Record<string, any> | null;
  certifications: string[];
  experience_years: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  schedules?: any[]; // Update with proper type when available
}