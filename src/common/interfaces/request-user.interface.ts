import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

/**
 * Extended Express Request interface with user property
 * This is the type of req.user after authentication
 */
export interface RequestUser extends JwtPayload {
  sub: string;
  phone: string;
  email: string;
  name: string;
  role: 'customer' | 'admin' | 'trainer';
}

