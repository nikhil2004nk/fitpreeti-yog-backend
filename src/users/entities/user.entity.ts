import { UserRole } from '../enums/user-role.enum';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone_number: string | null;
  profile_image: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_login: Date | null;
  bookings?: any[]; // Update with proper type when available
}
