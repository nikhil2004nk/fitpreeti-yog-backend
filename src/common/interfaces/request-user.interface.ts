import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

export interface RequestUser extends JwtPayload {
  sub: string;
  email: string;
  role: 'admin' | 'trainer' | 'customer';
}
