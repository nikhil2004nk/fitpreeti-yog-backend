import { UsersService } from './users.service';
import type { UserRole } from '../common/interfaces/user.interface';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<any>;
    findOne(phone: string): Promise<any>;
    updateRole(phone: string, role: UserRole): Promise<any>;
}
