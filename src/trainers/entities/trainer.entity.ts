// src/trainers/entities/trainer.entity.ts
export class Trainer {
  id: string;
  name: string;
  bio?: string;
  specializations: string[];
  profile_image?: string;
  certifications: string[];
  experience_years: number;
  rating: number;
  total_reviews: number;
  is_active: boolean;
  social_media: {
    instagram?: string;
    youtube?: string;
    [key: string]: any;
  };
  availability: Record<string, any>;
  created_at: string;
  updated_at: string;
}