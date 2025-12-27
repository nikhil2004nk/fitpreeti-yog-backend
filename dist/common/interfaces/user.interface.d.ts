export type UserRole = 'customer' | 'admin';
export interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    pin_hash: string;
    role: UserRole;
    created_at: string;
}
export interface UserLite {
    id?: number;
    name: string;
    email: string;
    phone: string;
    role: string;
    created_at?: string;
}
