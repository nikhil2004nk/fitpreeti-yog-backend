import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsEmail, IsOptional, IsArray } from 'class-validator';
import { UserRole } from '../../common/interfaces/user.interface';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsArray()
  @IsOptional()
  roles?: UserRole[];

  @IsOptional()
  isEmailVerified?: boolean;
}
