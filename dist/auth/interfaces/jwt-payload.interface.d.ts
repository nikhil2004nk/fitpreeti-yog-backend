import type { UserRole } from '../../common/interfaces/user.interface';
export interface JwtPayload {
    sub?: string;
    phone: string;
    email: string;
    name: string;
    role: UserRole;
}
