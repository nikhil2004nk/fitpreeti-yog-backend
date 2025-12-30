export interface Service {
  id: string; // UUID
  service_name: string;
  description: string;
  price: number;
  type: string;
  duration_minutes: number;
  trainer_id: string;
  category: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
