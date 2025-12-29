export interface Service {
  id: string; // UUID
  service_type: string;
  service_name: string;
  description: string;
  price: number;
  duration: number;
  created_at: string;
}
