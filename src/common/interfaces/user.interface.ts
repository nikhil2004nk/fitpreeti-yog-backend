import type { UserRole } from '../enums/user-role.enum';

export type UserRoleType = UserRole;

export interface UserLite {
  id: number;
  email: string;
  role: UserRoleType;
}
