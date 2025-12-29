import { UsersService } from './users.service';
import type { UserRole } from '../common/interfaces/user.interface';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<{
        id: string;
        phone: string;
        role: string;
        created_at: string;
    }[]>;
    findOne(phone: string): Promise<{
        id: string;
        phone: string;
        role: string;
        created_at: string;
    }>;
    updateRole(phone: string, role: UserRole): Promise<{
        id: string;
        phone: string;
        role: string;
        created_at: string;
    }>;
}
