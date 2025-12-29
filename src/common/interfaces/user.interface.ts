export type UserRole = 'customer' | 'admin';

export interface User {
  id: string; // UUID
  name: string;
  email: string;
  phone: string;
  pin: string;
  role: UserRole;
  created_at: string;
}

export interface UserLite {
  id?: string; // UUID
  name: string;
  email: string;
  phone: string;
  role: string;
  created_at?: string;
}
