import { UsersService } from './users.service';
import type { UserRole } from '../common/interfaces/user.interface';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<{
        id: string;
        name: string;
        email: string;
        phone: string;
        role: string;
        profile_image: string | null;
        is_active: boolean;
        last_login: string | null;
        created_at: string;
        updated_at: string;
    }[]>;
    findOne(phone: string): Promise<{
        id: string;
        name: string;
        email: string;
        phone: string;
        role: string;
        profile_image: string | null;
        is_active: boolean;
        last_login: string | null;
        created_at: string;
        updated_at: string;
    }>;
    updateRole(phone: string, role: UserRole): Promise<{
        id: string;
        name: string;
        email: string;
        phone: string;
        role: string;
        profile_image: string | null;
        is_active: boolean;
        last_login: string | null;
        created_at: string;
        updated_at: string;
    }>;
}
