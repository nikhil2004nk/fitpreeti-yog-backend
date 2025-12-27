import { UserRole } from '../../common/interfaces/user.interface';
export declare class UpdateUserDto {
    name?: string;
    email?: string;
    password?: string;
    roles?: UserRole[];
    isEmailVerified?: boolean;
}
