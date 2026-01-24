import { IsString, IsEmail, IsNotEmpty, MinLength, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
